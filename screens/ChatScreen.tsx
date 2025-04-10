import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, ScrollView, Linking, Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { UserContext } from "@/context/Usercontext";
import { SendMessage, GetUserMessages } from "@/actions/user";
import DoubleTickBlueIcon from './DoubleTickBlueIcon'
import DoubleTickGreyIcon from './DoubleTickGreyIcon'
import io from "socket.io-client";
import * as DocumentPicker from 'expo-document-picker';
import { BACKEND } from "@/config";
import { registerForPushNotificationsAsync } from './Notification';
import { Image } from 'expo-image';

const socket = io("55");

type Message = {
    name: any;
    messageContent: any;
    _id: string;
    createdAt: string;
    sender: string;
    files: any;
    type: any;
};




const ChatScreen = ({ route }: { route: any }) => {


    const { user, setUser } = useContext(UserContext);
    const { userId, userName, groupId } = route.params;

    const [selectedImage, setSelectedImage] = useState(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [docMessage, setDocMessage] = useState("");
    const [pickedDocument, setPickedDocument] = useState<any>(null);

    const flatListRef = useRef<FlatList>(null);


    useEffect(() => {
        registerForPushNotificationsAsync(user?.user._id);
    }, []);



    // Fetch messages on mount
    useEffect(() => {
        const fetchMessages = async () => {
            const fetchedMessages = await GetUserMessages(user?.user._id, userId, groupId);
            if (fetchedMessages) {
                setMessages(fetchedMessages);

                scrollToBottom();
            }
        };

        fetchMessages();

        // Listen for incoming messages
        socket.on("loadMessages", (newMessages) => {
            setMessages((prev) => [...prev, ...newMessages]);
            scrollToBottom(); // Scroll to latest message
        });

        return () => {
            socket.off("loadMessages");
        };
    }, [userId, groupId]);

    // Scroll to bottom function
    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
    };


    /*
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        // Create a temporary message to display instantly
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            _id: tempId,
            messageContent: newMessage,
            createdAt: new Date().toISOString(),
            sender: user?.user._id,
            files: undefined,
            type: undefined,
            name: undefined
        };

        setMessages((prev) => [...prev, tempMessage]); // Append to messages
        setNewMessage(""); // Clear input
        scrollToBottom(); // Scroll down after sending message

        const formData = {
            sender: user?.user._id,
            receiver: userId,
            group: groupId || null,
            type: "text",
            messageContent: newMessage,
        };

        try {
            const response = await SendMessage(formData);
            if (response && response._id) {
                setMessages((prev) =>
                    prev.map((msg) => (msg._id === tempId ? { ...msg, _id: response._id } : msg))
                );
                socket.emit("sendMessage", response);
                scrollToBottom(); // Ensure scrolling after message is sent
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        }
    };
*/

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
            // console.log(response);

            if (response && response.message._id) {

                setMessages((prev) => prev.map((msg) => (msg._id === tempId ? { ...msg, _id: response.message._id } : msg)));
                // socket.emit("sendMessage", response);
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


            socket.emit("readMessages", {
                senderId: userId,
                receiverId: user?.user._id,
                groupId
            });

        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            const fetchedMessages = await GetUserMessages(user?.user._id, userId, groupId);
            if (fetchedMessages) {
                setMessages(fetchedMessages);
                scrollToBottom();
            }

            await markMessagesAsRead();
        };

        fetchMessages();

        socket.on("loadMessages", (newMessages) => {
            setMessages((prev) => [...prev, ...newMessages]);
            scrollToBottom();
        });

        socket.on("readMessages", ({ readMessageIds }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    readMessageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
                )
            );
        });

        return () => {
            socket.off("loadMessages");
        };
    }, [userId, groupId]);





    /*
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
    
            setMessages(prev => [...prev, ...tempMessages]);
            setModalVisible(false);
    
            try {
                const formData = new FormData();
    
                pickedDocument.forEach((doc: any) => {
                    formData.append("file", {
                        uri: doc.uri,
                        name: doc.name,
                        type: doc.type || "application/octet-stream",
                    } as any);
                });
    
                formData.append("sender", user?.user?._id || "");
                formData.append("type", "file");
                formData.append("receiver", userId || "");
                formData.append("messageContent", '00');
                formData.append("group", '');
    
                const response = await fetch(`${BACKEND}/send`, {
                    method: "POST",
                    body: formData,
                    headers: {
                        Accept: "application/json",
                    },
                });
    
                const result = await response.json();
    
    
                if (result?.success && Array.isArray(result?.message?.messageContent)) {
                    const uploadedUrls = result?.message?.messageContent;
    
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
                                };
                            }
    
                            return msg;
                        })
                    );
                } else {
                    throw new Error("Upload failed or invalid response from server.");
                }
            } catch (err) {
                console.error("Sending document failed:", err);
                setMessages(prev =>
                    prev.map(msg =>
                        tempMessages.find((temp: { _id: string; }) => temp._id === msg._id)
                            ? { ...msg, status: "failed" }
                            : msg
                    )
                );
            } finally {
                setPickedDocument([]);
            }
        };

    */



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












    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >


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
                        <View
                            style={[
                                styles.messageItem,
                                isMyMessage ? styles.myMessage : styles.otherMessage,
                                { alignSelf: isMyMessage ? "flex-end" : "flex-start" },
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
                                    (item?.isRead ? (
                                        <DoubleTickBlueIcon size={14} color="blue" />
                                    ) : (
                                        <DoubleTickGreyIcon size={14} color="grey" />
                                    ))}
                            </View>
                        </View>
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


            <View style={styles.inputContainer}>

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




});

export default ChatScreen;