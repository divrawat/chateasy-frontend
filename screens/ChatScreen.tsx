import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView, Linking, Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { UserContext } from "@/context/Usercontext";
import { SendMessage, GetUserMessages } from "@/actions/user";
import DoubleTickBlueIcon from './DoubleTickBlueIcon'
import DoubleTickGreyIcon from './DoubleTickGreyIcon'
import * as DocumentPicker from 'expo-document-picker';
import { BACKEND } from "@/config";
import { Image } from 'expo-image';
import { BlockUser, UnBlockUser, DeleteMessage, MuteUser, refreshUser, UnMuteUser } from "@/actions/user";
import socket from "../socket";
import { useNavigation } from '@react-navigation/native';

type Message = {
    isRead: any;
    name: any;
    messageContent: any;
    _id: string;
    createdAt: string;
    sender: string;
    files: any;
    type: any;
};


const ChatScreen = ({ route }: { route: any }) => {

    const navigation = useNavigation();

    const [showOptions, setShowOptions] = useState(false);


    const { user, setUser, setActiveChatFriendId } = useContext(UserContext);
    const { userId, userName, groupId } = route.params;

    const [selectedImage, setSelectedImage] = useState(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [pickedDocument, setPickedDocument] = useState<any>(null);

    const flatListRef = useRef<FlatList>(null);

    const fetchMessages = async () => {

        const fetchedMessages = await GetUserMessages(user?.user._id, userId, groupId);

        if (fetchedMessages) {
            const updatedMessages = fetchedMessages.map((msg: { isDeleted: any; }) => {
                if (msg?.isDeleted) {
                    return {
                        ...msg,
                        messageContent: "Message is deleted",
                        mediaUrl: null
                    };
                }
                return msg;
            });

            setMessages(updatedMessages);

            scrollToBottom();
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setShowOptions(prev => !prev)}>
                    <Text style={styles.dots}>⋮</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);


    const markMessagesAsRead = async () => {

        try {
            await fetch(`${BACKEND}/mark-read`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    senderId: userId,
                    receiverId: user?.user._id,
                    groupId: groupId || null
                }),
            });

        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    };


    const markSingleMessageAsRead = async (messageId: any) => {
        try {
            await fetch(`${BACKEND}/markMessageAsRead`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messageId: messageId,
                }),
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };


    const markMultipleMessagesAsRead = async (messageIds: string[]) => {
        try {
            await fetch(`${BACKEND}/markMultipleMessagesAsRead`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messageIds, senderId: userId, receiverId: user?.user._id, }),
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const fetchMessages2 = async () => {

        const fetchedMessages = await GetUserMessages(user?.user._id, userId, groupId);
        if (fetchedMessages) {
            setMessages(fetchedMessages);

            const unreadMessageIds = fetchedMessages
                .filter((msg: any) => msg.sender !== user?.user._id && !msg.isRead).map((msg: any) => msg._id);

            if (unreadMessageIds.length > 0) {
                try {
                    await markMultipleMessagesAsRead(unreadMessageIds);
                    setMessages((prevMessages) =>
                        prevMessages.map((msg) =>
                            unreadMessageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
                        )
                    );
                } catch (error) {
                    console.error("Error marking messages as read:", error);
                }
            }
        }
    };




    const friend = user?.friends?.find(friend => friend._id === userId);
    const hasMutedMe = friend?.mutedUsers?.includes(user?.user?._id);


    function Count0() {
        const friendId = userId;
        setUser((prevUser) => {
            if (!prevUser?.friends) return prevUser;

            const updatedFriends = prevUser.friends.map(friend =>
                friend._id === friendId
                    ? { ...friend, unreadCount: 0 }
                    : friend
            );

            return { ...prevUser, friends: updatedFriends };
        });
    }



    useEffect(() => {

        // markMessagesAsRead();
        fetchMessages2();
        Count0();

        // if (!hasMutedMe) { fetchMessages2(); }
        // if (hasMutedMe) { fetchMessages() }



        const roomId = `chat_${[user?.user._id, userId].sort().join('_')}`;
        socket.emit("joinRoom", roomId);

        const handleMessage = (message: any) => {
            if (message.sender === user?.user._id) return;
            if (message.roomId !== roomId) return;
            setMessages((prev) => [...prev, message]);
            markSingleMessageAsRead(message._id);
        };

        const MarkMultipleMessagesRead = (result: any) => {
            // console.log('000000000');

            setMessages((prevMessages) =>
                prevMessages.map((msg) => {
                    if (result && result.ids && result.ids.includes(msg._id)) {
                        return { ...msg, isRead: true };
                    }
                    return msg;
                })
            );
        };


        const handleMessagesRead = (updatedMessage: any) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) => {
                    if (updatedMessage?._id === msg._id) {
                        return { ...msg, isRead: true };
                    }
                    return msg;
                })
            );
        };



        const handleMuteUser = (data: any) => {
            const { userTobeMuted, userwhohavemuted } = data;

            if (user?.user?._id === userwhohavemuted) { return; }

            setUser((prevUser) => {
                if (!prevUser) return prevUser;

                const updatedFriends = prevUser.friends?.map((friend: any) => {
                    if (friend._id === userTobeMuted) {
                        if (!friend.mutedUsers.includes(prevUser.user._id)) {

                            friend.mutedUsers = [...friend.mutedUsers, prevUser.user._id];
                        }
                    }
                    return friend;
                });

                const updatedMutedUsers = prevUser.mutedUsers.includes(userTobeMuted)
                    ? prevUser.mutedUsers
                    : [...prevUser.mutedUsers, userTobeMuted];



                return {
                    ...prevUser,
                    friends: updatedFriends,
                    mutedUsers: updatedMutedUsers,
                };


            });

        };



        const handleUnMuteUser = (data: any) => {
            const { userTobeUnMuted } = data;

            setUser((prevUser) => {
                if (!prevUser) return prevUser;

                const updatedFriends = prevUser?.friends?.map((friend: any) => {
                    if (friend._id === userTobeUnMuted) {
                        friend.mutedUsers = friend.mutedUsers.filter(
                            (mutedUserId: string) => mutedUserId !== prevUser._id
                        );
                    }
                    return friend;
                });

                const updatedMutedUsers = prevUser.mutedUsers.filter(
                    (mutedUserId: string) => mutedUserId !== userTobeUnMuted
                );


                return {
                    ...prevUser,
                    friends: updatedFriends,
                    mutedUsers: updatedMutedUsers,
                };
            });
        };

        socket.on("receiveMessage", handleMessage);
        socket.on("Mute", handleMuteUser);
        socket.on("UnMute", handleUnMuteUser);

        // if (!hasMutedMe) {

        // }

        socket.on("markMultipleMessagesAsRead", MarkMultipleMessagesRead);
        socket.on("messageMarkedAsRead", handleMessagesRead);



        return () => {
            socket.off("receiveMessage", handleMessage);
            socket.off("markMultipleMessagesAsRead", MarkMultipleMessagesRead);
            socket.off("messageMarkedAsRead", handleMessagesRead);
            socket.off("Mute", handleMuteUser);
            socket.off("UnMute", handleUnMuteUser);
        };
    }, [user?.user._id]);


    const scrollToBottom = () => { setTimeout(() => { flatListRef.current?.scrollToOffset({ offset: 0, animated: true }); }, 100); };


    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            _id: tempId,
            messageContent: newMessage,
            createdAt: new Date().toISOString(),
            sender: user?.user._id,
            files: undefined,
            type: "text",
            isRead: false,
            name: undefined
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage("");
        scrollToBottom();

        const formData = {
            sender: user?.user._id,
            receiver: userId,
            group: groupId || null,
            type: "text",
            messageContent: newMessage,
        };

        try {
            const response = await SendMessage(formData);

            if (response && response.message._id) {

                setMessages((prev) => prev.map((msg) => (msg._id === tempId ? { ...msg, _id: response.message._id } : msg)));
                scrollToBottom();

                setUser((prevUser) => {

                    if (!prevUser?.friends) return prevUser;

                    const updatedFriends = prevUser.friends.map((friend) =>

                        friend._id === userId
                            ? {
                                ...friend,
                                lastMessage: newMessage,
                                lastMessageTime: new Date().toISOString(),
                            }
                            : friend
                    );


                    return {
                        ...prevUser,
                        friends: updatedFriends,
                    };
                });

            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        }
    };

    const formatTime = (isoString: string): string => {
        const date = new Date(isoString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";

        hours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, "0");

        return `${hours}:${formattedMinutes} ${ampm}`;
    };


    const block = async (userId: string, blockedby: string) => {

        const response = await BlockUser(userId, blockedby);
        if (response.message) {
            setUser(prev => {
                if (!prev) return prev;
                return { ...prev, blockedUsers: [...(prev.blockedUsers || []), userId] };
            });

        }
        else {
            console.error("Failed to block user:", response.error);
        }
    }


    const BlueTick = async (userTobeMuted: string, userwhohavemuted: string) => {
        try {
            const response = await MuteUser(userTobeMuted, userwhohavemuted);

            if (response?.success) {

                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }

                Alert.alert('User Muted Successfully')
            } else {
                console.error(response.error);
            }
        } catch (error) {
            console.error("Error in BlueTick function:", error);
        }
    };


    const ShowBlueTick = async (userTounbeunMuted: string, userwhohavemuted: string) => {
        try {
            const response = await UnMuteUser(userTounbeunMuted, userwhohavemuted);

            if (response?.success) {

                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }

                Alert.alert('User Muted Successfully')
            } else {
                console.error(response.error);
            }
        } catch (error) {
            console.error("Error in BlueTick function:", error);
        }
    };


    const isUserBlocked = user?.blockedUsers?.map(id => id).includes(userId);

    const handleUnblock = async (userId: string, blockedby: string) => {

        const response = await UnBlockUser(userId, blockedby);

        if (response.message === "User unblocked successfully.") {
            setUser(prev => {
                if (!prev) return prev;
                return { ...prev, blockedUsers: prev.blockedUsers.filter(id => id !== userId), };
            });
            setShowOptions(false);
        }
        else {
            console.error("Failed to block user:", response.error);
        }
    };




    const pickDocument = async () => {
        try {
            const result: any = await DocumentPicker.getDocumentAsync({
                // type: "*/*",
                type: [
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                    'image/gif',
                    "image/webp",
                    "audio/mpeg",
                    "video/mp4",
                ],
                multiple: true,
                copyToCacheDirectory: true,
            });


            if (result && result.assets && result.assets.length > 0) {
                setPickedDocument(
                    result.assets.map((asset: any) => ({
                        uri: asset.uri,
                        name: asset.name,
                        type: asset.mimeType || "application/octet-stream",
                    }))
                );
                setModalVisible(true);
            } else {
                console.log('Document picking was canceled by the user.');
            }
        } catch (error) {
            console.log("Error picking multiple documents:", error);
        }
    };

    const sendDocument = async () => {
        if (!pickedDocument || pickedDocument.length === 0) return;

        const tempMessages = pickedDocument.map((doc: any) => ({
            _id: Date.now() + Math.random(),
            type: 'file',
            sender: user?.user?._id,
            name: doc.name,
            createdAt: new Date().toISOString(),
            uri: doc.uri,
            mimeType: doc.type,
            status: "uploading",
            isTemp: true,
        }));
        // console.log(tempMessages);


        setMessages(prev => [...prev, ...tempMessages]);
        setModalVisible(false);

        try {
            const formData = new FormData();

            pickedDocument.forEach((doc: any, index: number) => {
                formData.append("files", {
                    uri: doc.uri,
                    name: doc.name,
                    type: doc.type || "application/octet-stream",
                    index,
                } as any);
            });

            formData.append("sender", user?.user?._id || "");
            formData.append("type", "file");
            formData.append("receiver", userId || "");
            formData.append("messageContent", '00');
            formData.append("group", '');


            /*
                        for (const pair of formData.entries()) {
                            console.log(pair[0], pair[1]);
                        }
             */


            const response = await fetch(`${BACKEND}/send`, {
                method: "POST",
                body: formData,
                headers: {
                    Accept: "application/json",
                },
            });

            const result = await response.json();
            // console.log('resutl', result);



            if (result?.success) {
                const uploadedUrls = result?.message?.messageContent;
                // console.log('000000', uploadedUrls);

                setMessages(prev =>
                    prev.map(msg => {
                        const index = pickedDocument.findIndex((doc: { name: any; }) => doc.name === msg?.name);
                        const matchedUrl = uploadedUrls[index];

                        if (index !== -1 && matchedUrl) {
                            return {
                                ...msg,
                                status: "sent",
                                isTemp: false,
                                serverUrl: matchedUrl,
                                uri: matchedUrl,
                            };
                        }
                        return msg;
                    })
                );


                const messageContent = result?.message?.messageContent;

                const lastmessagecontenturl = Array.isArray(messageContent)
                    ? messageContent[messageContent.length - 1]
                    : messageContent;

                const isGif = typeof lastmessagecontenturl === 'string' && lastmessagecontenturl.endsWith('.gif');

                const isImage = typeof lastmessagecontenturl === 'string' &&
                    (lastmessagecontenturl.endsWith('.jpg') ||
                        lastmessagecontenturl.endsWith('.jpeg') ||
                        lastmessagecontenturl.endsWith('.png') ||
                        lastmessagecontenturl.endsWith('.webp'));

                const MylastMessage = isGif ? 'gif' : isImage ? 'photo' : 'document';




                setUser((prevUser) => {

                    if (!prevUser?.friends) return prevUser;

                    const updatedFriends = prevUser.friends.map((friend) =>

                        friend._id === userId
                            ? {
                                ...friend,
                                lastMessage: MylastMessage,
                                lastMessageTime: new Date().toISOString(),
                            }
                            : friend
                    );
                    return {
                        ...prevUser,
                        friends: updatedFriends,
                    };
                });



            } else {
                throw new Error("Upload failed or invalid response from server.");
            }
        } catch (err) {
            console.error("Sending document failed:", err);
        } finally {
            setPickedDocument([]);
        }
    };

    const deleteMessage = async (messageId: any, sender: any) => {

        const response = await DeleteMessage(messageId, sender);
        if (response.message) {
            fetchMessages();
        }

        else {
            Alert.alert("Error", 'You can only delete your message');
        }
    };



    const handleLongPress = (message: any, sender: any) => {
        const displayText = typeof message?.messageContent === 'string' ? message.messageContent : "Document";

        Alert.alert(
            "Delete Message",
            `Do you want to delete " ${displayText} "`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: () => deleteMessage(message._id, sender)
                }
            ],
            { cancelable: true }
        );
    }


    const isUserMuted = user?.mutedUsers?.some(mutedUser => mutedUser._id === userId);


    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >


            <View style={styles.container} >
                {showOptions && !isUserBlocked && (
                    <View style={styles.optionsBox}>

                        <TouchableOpacity onPress={() => block(userId, user?.user._id)}>
                            <Text style={styles.option}>Block</Text>
                        </TouchableOpacity>


                        {!isUserMuted && <TouchableOpacity onPress={() => BlueTick(userId, user?.user._id)}>
                            <Text style={styles.option}>Dont Show Blue Tick</Text>
                        </TouchableOpacity>}


                        {isUserMuted && <TouchableOpacity onPress={() => ShowBlueTick(userId, user?.user._id)}>
                            <Text style={styles.option}>Show Blue Tick</Text>
                        </TouchableOpacity>}



                    </View>
                )}
            </View>


            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={{ alignSelf: "flex-end" }}
                        >
                            <Text style={{ fontSize: 18 }}>✖</Text>
                        </TouchableOpacity>

                        <ScrollView style={{ maxHeight: 300 }}>
                            {pickedDocument?.map((doc: any, index: any) => (
                                <View key={index} style={{ marginBottom: 10 }}>
                                    <Text style={{ fontWeight: "bold" }}>{doc.name}</Text>

                                    {doc.type.startsWith("image/") ||
                                        doc.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <Image
                                            source={{ uri: doc.uri }}
                                            style={{ width: 200, height: 200, marginTop: 5 }}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Text style={{ marginTop: 5 }}>📄 Preview not available</Text>
                                    )}
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.sendButton} onPress={sendDocument}>
                            <Text style={{ color: "#fff", textAlign: "center" }}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>



            <FlatList
                ref={flatListRef}
                data={[...messages].reverse()}
                keyExtractor={(item) => item._id}


                renderItem={({ item }) => {
                    const isMyMessage = item.sender === user?.user._id;


                    return (
                        <Pressable onLongPress={() => handleLongPress(item, user?.user._id)} delayLongPress={500}>
                            <View
                                style={[
                                    styles.messageItem,
                                    isMyMessage ? styles.myMessage : styles.otherMessage,
                                    {
                                        alignSelf: isMyMessage ? "flex-end" : "flex-start",
                                    },
                                ]}
                            >


                                {item.status === "sent" ? (
                                    item?.mimeType?.startsWith('image/') ? (
                                        <TouchableOpacity onPress={() => setSelectedImage(item.serverUrl)}>
                                            <Image
                                                source={{ uri: item.serverUrl }}
                                                style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 10 }}
                                            />
                                        </TouchableOpacity>
                                    ) : item?.mimeType === 'application/pdf' ? (
                                        <TouchableOpacity onPress={() => Linking.openURL(item.serverUrl)}>
                                            <View style={{ maxWidth: 250 }}>
                                                <Text style={{ color: "blue", fontWeight: "bold" }}>
                                                    📕 PDF: {item.name}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ) : item?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                                        <TouchableOpacity onPress={() => Linking.openURL(item.serverUrl)}>
                                            <View style={{ maxWidth: 250 }}>
                                                <Text style={{ color: "blue", fontWeight: "bold" }}>
                                                    📘 DOCX: {item.name}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity onPress={() => Linking.openURL(item.serverUrl)}>
                                            <View style={{ maxWidth: 250 }}>
                                                <Text style={{ color: "blue", fontWeight: "bold" }}>
                                                    📄 {item.name}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                ) : item.status === "uploading" && (
                                    <View style={{ maxWidth: 250 }}>
                                        <Text>Uploading: {item.name}</Text>
                                        {item?.mimeType?.startsWith('image/') && (
                                            <Text>(Preview unavailable)</Text>
                                        )}
                                    </View>
                                )}



                                {item.type === "file" ? (

                                    <View >
                                        {item?.messageContent?.map((uri: any, index: any) => (
                                            <TouchableOpacity key={index} onPress={() => setSelectedImage(uri)}>
                                                <Image
                                                    source={{ uri }}
                                                    style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 10 }}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>



                                ) : item.type === "document" ? (
                                    <View style={{ maxWidth: 250 }}>
                                        <Text style={{ color: "blue", fontWeight: "bold" }}>
                                            📄 {item.name}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.messageText}>{item?.messageContent}</Text>
                                )}



                                <View style={styles.timeAndTicks}>
                                    <Text style={styles.timestamp}>{formatTime(item?.createdAt)} </Text>
                                    {isMyMessage &&
                                        (item?.isRead && !hasMutedMe ? (
                                            <DoubleTickBlueIcon size={14} color="blue" />
                                        ) : (
                                            <DoubleTickGreyIcon size={14} color="grey" />
                                        ))}

                                </View>
                            </View>
                        </Pressable>
                    );
                }}

                inverted={true}
            />


            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalContainer}>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullscreenImage}
                        />
                    )}
                    <Pressable style={styles.closeButton} onPress={() => setSelectedImage(null)}>
                        <Text style={{ color: "#fff", fontSize: 25 }}>✖</Text>
                    </Pressable>
                </View>
            </Modal>


            {!isUserBlocked && <View style={styles.inputContainer}>

                <TouchableOpacity style={styles.iconButton} onPress={pickDocument}>
                    <FontAwesome name="paperclip" size={24} color="#3B82F6" />
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />

                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <FontAwesome name="paper-plane" size={24} color="white" />
                </TouchableOpacity>
            </View>
            }

            {isUserBlocked && (
                <View style={styles.centeredContainer}>
                    <TouchableOpacity onPress={() => handleUnblock(userId, user?.user._id)} style={styles.unblockButton}>
                        <Text style={styles.unblockText}>Unblock User</Text>
                    </TouchableOpacity>
                </View>
            )}

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
    messageItem: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 5,
        maxWidth: "70%",

    },

    myMessage: {
        backgroundColor: "#25D366",
        borderTopRightRadius: 0,
    },

    otherMessage: {
        backgroundColor: "#3B82F6",
        borderTopLeftRadius: 0,
    },

    messageText: { fontSize: 16, color: "#fff" },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderColor: "#ddd",
    },
    input: {
        flex: 1,
        padding: 10,
        fontSize: 16,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        marginHorizontal: 5,
    },
    sendButton: {
        backgroundColor: "#25D366",
        padding: 10,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    iconButton: {
        padding: 8,
        marginRight: 5,
    },
    timeAndTicks: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 5,
    },

    timestamp: {
        fontSize: 12,
        color: "#eee",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    textInput: {
        borderColor: "#ccc",
        borderWidth: 1,
        width: "100%",
        borderRadius: 6,
        padding: 10,
        marginVertical: 10,
    },



    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullscreenImage: {
        width: "90%",
        height: "90%",
        borderRadius: 10,
        resizeMode: "contain",
    },
    closeButton: {
        position: "absolute",
        top: 5,
        right: 10,
        backgroundColor: "black",
        borderRadius: 20,
        padding: 10,
    },
    dots: {
        fontSize: 24,
        paddingRight: 16,
    },


    optionsBox: {
        position: 'absolute',
        zIndex: 10,
        right: 10,
        backgroundColor: '#ffff',
        padding: 14,
        borderRadius: 6,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    option: {
        paddingVertical: 10,
        fontSize: 16,
    },

    centeredContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    unblockButton: {
        backgroundColor: '#FF5252', // red or any visible color
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    unblockText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

});

export default ChatScreen;