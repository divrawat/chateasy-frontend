import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, ScrollView, Linking, Pressable, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { UserContext } from "@/context/Usercontext";
import { SendMessage, GetUserMessages } from "@/actions/user";
import DoubleTickBlueIcon from './DoubleTickBlueIcon'
import DoubleTickGreyIcon from './DoubleTickGreyIcon'
import * as DocumentPicker from 'expo-document-picker';
import { BACKEND } from "@/config";
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/nav";
import { DeleteGroup, refreshUser, LeaveGroup } from "@/actions/user";
import socket from "../socket";

type Message = {
    name: any;
    messageContent: any;
    _id: string;
    createdAt: string;
    sender: string;
    files: any;
    type: any;
};




const GroupChatScreen = ({ route }: { route: any }) => {


    const [showOptions, setShowOptions] = useState(false);
    const navigation = useNavigation();

    const navigation1 = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setShowOptions(prev => !prev)}>
                    <Text style={styles.dots}>⋮</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);


    const { user, setUser } = useContext(UserContext);
    const { groupName, groupId, groupPhoto, groupdescription, groupcreator, groupadmins, groupmembers } = route.params;



    const [selectedImage, setSelectedImage] = useState(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [pickedDocument, setPickedDocument] = useState<any>(null);

    const flatListRef = useRef<FlatList>(null);


    // useEffect(() => { registerForPushNotificationsAsync(user?.user._id); }, []);

    const currentGroup = user?.groups?.find((group) => group._id.toString() === groupId);
    const leftUserInfo = currentGroup?.leftUsers?.find((leftUser: any) => leftUser.user === user?.user._id);

    const fetchMessages = async () => {

        const leaveTime = leftUserInfo?.leftAt;
        const fetchedMessages = await GetUserMessages(user?.user._id, 'userId', groupId);

        if (fetchedMessages) {
            const filteredMessages = leaveTime
                ? fetchedMessages?.filter(
                    (message: any) => new Date(message.createdAt) < new Date(leaveTime)
                )
                : fetchedMessages;

            setMessages(filteredMessages);
            scrollToBottom();
        }
    };


    /*
        useEffect(() => {
    
            if (!leftUserInfo) { }
    
            fetchMessages();
            const roomId = `group_${groupId}`;
            socket.emit("joinRoom", roomId);
    
            const handleGroupMessage = (message: any) => {
                if (message.sender === user?.user._id) return;
                if (message.group !== groupId) return;
                setMessages((prev) => [...prev, message]);
            };
    
            if (!leftUserInfo) { socket.on("receiveGroupMessage", handleGroupMessage); }
    
            return () => {
                socket.off("receiveGroupMessage", handleGroupMessage);
            };
    
    
        }, [groupId]);
    */


    const userId = user?.user._id;
    const isMember = user?.groups?.some(group =>
        group.members?.some((member: { _id: any; }) => member._id === userId)
    );


    useEffect(() => {
        fetchMessages();
        const roomId = `group_${groupId}`;
        socket.emit("joinRoom", roomId);

        const handleGroupMessage = (message: any) => {
            if (message.sender === user?.user._id) return;
            if (message.group !== groupId) return;
            setMessages((prev) => [...prev, message]);
        };

        if (isMember) { socket.on("receiveGroupMessage", handleGroupMessage); }

        return () => { socket.off("receiveGroupMessage", handleGroupMessage); };

    }, [groupId, leftUserInfo]);


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
            name: undefined
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage("");
        scrollToBottom();

        const formData = {
            sender: user?.user._id,
            // receiver: userId,
            group: groupId || null,
            type: "text",
            messageContent: newMessage,
        };

        try {
            const response = await SendMessage(formData);

            if (response && response.message._id) {

                setMessages((prev) => prev.map((msg) => (msg._id === tempId ? { ...msg, _id: response.message._id } : msg)));
                // socket.emit("sendMessage", response);
                scrollToBottom();


                setUser((prevUser) => {

                    if (!prevUser?.groups) return prevUser;

                    const updatedgroups = prevUser?.groups.map((group) =>

                        group._id === groupId
                            ? {
                                ...group,
                                lastMessage: newMessage,
                                lastMessageTime: new Date().toISOString(),
                            }
                            : group
                    );

                    return {
                        ...prevUser,
                        groups: updatedgroups,
                    };
                });

            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => prev?.filter((msg) => msg._id !== tempId));
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
            // formData.append("receiver", "");
            formData.append("group", groupId);
            formData.append("type", "file");
            formData.append("messageContent", '00');


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

                    if (!prevUser?.groups) return prevUser;

                    const updatedgroups = prevUser?.groups.map((group) =>

                        group._id === groupId
                            ? {
                                ...group,
                                lastMessage: MylastMessage,
                                lastMessageTime: new Date().toISOString(),
                            }
                            : group
                    );
                    return {
                        ...prevUser,
                        groups: updatedgroups,
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


    const group = user?.groups?.find((g) => g._id === groupId);
    const isCreator = group?.creator === user?.user?._id;
    const isAdmin = group?.admins?.includes(user?.user?._id);



    async function deleteGroup(groupId: string, userId: string) {

        if (groupId == '' || userId == '') Alert.alert('Error', 'No GroupId or UserId');

        try {
            const response = await DeleteGroup(groupId, userId);
            if (response.message) {
                Alert.alert('Success', 'Group Deleted');
                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }

                navigation1.navigate("DashBoard", { initialTab: "GROUPS" });
            }

        } catch (error) {
            Alert.alert('Error', 'Failed to Delete Group');
        }
    }


    async function leaveGroup(groupId: string, userId: string) {

        if (groupId == '' || userId == '') Alert.alert('Error', 'No GroupId or UserId');

        try {
            const response = await LeaveGroup(groupId, userId);
            if (response.message) {
                Alert.alert('Success', 'Group Left');
                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }
                navigation1.navigate("DashBoard", { initialTab: "GROUPS" });
            }

        } catch (error) {
            Alert.alert('Error', 'Failed to Leave Group');
        }
    }





    return (
        <KeyboardAvoidingView style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >




            <View style={styles.container} >
                {showOptions && (
                    <View style={styles.optionsBox}>

                        {/* groupName, groupId, groupPhoto, groupdescription, groupcreator, groupadmins, groupmembers */}

                        <TouchableOpacity onPress={() => navigation1.navigate("GroupInfoScreen", {
                            groupName, groupId, groupPhoto, groupdescription, groupcreator, groupadmins, groupmembers
                        })}>
                            <Text style={styles.option}>View Group Info</Text>
                        </TouchableOpacity>

                        {!isCreator && isMember &&
                            <TouchableOpacity onPress={() => alert('Mute Notifications')}>
                                <Text style={styles.option}>Mute Notifications</Text>
                            </TouchableOpacity>
                        }


                        {(isCreator || isAdmin) && (
                            <TouchableOpacity onPress={() => navigation1.navigate("AddRemoveMembers", {
                                groupId, groupcreator, groupadmins, groupmembers
                            })}>
                                <Text style={styles.option}>Add or Remove Members</Text>
                            </TouchableOpacity>
                        )}


                        {(isCreator || isAdmin) && (
                            <TouchableOpacity onPress={() => navigation1.navigate("MakeAdmins", {
                                groupId, groupcreator, groupadmins, groupmembers
                            })}>
                                <Text style={styles.option}>Make Admin</Text>
                            </TouchableOpacity>
                        )}


                        {isCreator && (
                            <TouchableOpacity onPress={() => deleteGroup(groupId, user?.user._id)}>
                                <Text style={styles.option}>Delete Group</Text>
                            </TouchableOpacity>
                        )}

                        {!isCreator && isMember && (
                            <TouchableOpacity onPress={() => leaveGroup(groupId, user?.user._id)}>
                                <Text style={styles.option}>Leave Group</Text>
                            </TouchableOpacity>
                        )}


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
                    // console.log(messages);

                    return (
                        <View
                            style={[
                                styles.messageItem,
                                isMyMessage ? styles.myMessage : styles.otherMessage,
                                { alignSelf: isMyMessage ? "flex-end" : "flex-start" },
                            ]}
                        // style={[
                        //     styles.messageItem,
                        //     item.type === "system"
                        //         ? { alignSelf: "center", maxWidth: 250, marginVertical: 5 }
                        //         : isMyMessage
                        //             ? styles.myMessage
                        //             : styles.otherMessage,
                        // ]}
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
                                    <Text style={{ color: "blue", fontWeight: "bold", }}>
                                        📄 {item.name}
                                    </Text>
                                </View>
                            ) : item.type === "system" ? (
                                <View style={{ maxWidth: 250, alignSelf: "center", marginVertical: 5 }}>
                                    <Text style={{ color: "black", fontWeight: "bold", fontSize: 10, textAlign: "center" }}>
                                        {item.messageContent}
                                    </Text>
                                </View>

                            ) : (
                                <View>
                                    {/* <Text style={styles.messageText}>{item?.name}</Text> */}
                                    <Text style={styles.messageText}>{item?.messageContent}</Text>
                                </View>
                            )

                            }


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





            <View style={styles.footerContainer}>

                {isMember &&

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
                    </View>}

            </View>

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

    leftGroupContainer: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },

    leftGroupText: {
        fontSize: 16,
    },

    footerContainer: {
        // This keeps space reserved even if input is not shown
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },

});

export default GroupChatScreen;