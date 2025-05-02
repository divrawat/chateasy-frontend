import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, Alert, Image, View, FlatList } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createGroup } from '@/actions/user';
import { UserContext } from "@/context/Usercontext";
import { useContext } from 'react';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/nav";
import { refreshUser } from '@/actions/user';
import { useEffect } from 'react';
import socket from "../socket";

const CreateGroupScreen: React.FC = () => {

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


    const [modalVisible, setModalVisible] = useState(false);
    const [grouphoto, setgrouphoto] = useState("");

    const { user, setUser } = useContext(UserContext);

    const [formdata, setFormData] = useState({
        name: '',
        description: '',
        photo: '',
        creator: '',
        members: '',
        admins: '',
        isPrivate: false,
    });

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePickImage = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (result.assets && result.assets.length > 0) {
            handleChange('photo', result.assets[0].uri);
            setgrouphoto(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append("creator", user?.user._id);
        formData.append("name", formdata?.name);
        formData.append("description", formdata?.description);

        if (grouphoto) {
            formData.append("file", {
                uri: grouphoto,
                name: `profile_${user?.user._id}.jpg`,
                type: "image/jpeg",
            } as any);
        }


        const result = await createGroup(formData);
        if (result?.message) {
            Alert.alert("Success", "Group created successfully!");

            const fetchedData: any = await refreshUser(user?.user._id);
            if (fetchedData) {
                setUser(fetchedData);
            }
            /*
                        setUser((prev: any) => ({
                            ...prev, groups: [...prev.groups, result.newgroup],
                        }));
                        */


            setModalVisible(false);

            setFormData({
                name: '',
                description: '',
                photo: '',
                creator: '',
                members: '',
                admins: '',
                isPrivate: false,
            });
        } else {
            Alert.alert("Error", "Failed to create group.");
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

    // console.log(JSON.stringify(user?.groups, null, 2));
    // const currentGroup = user?.groups.find((group) => group._id.toString() === groupId);
    // const isUserInLeftUsers = currentGroup.leftUsers.some((leftUser: any) => leftUser.user === user?.user._id);

    /*
        useEffect(() => {
            socket.emit("joinRoom", user?.user._id);
            const handleAddedToGroup = (groupData: any) => {
    
                setUser((prevUser) => {
                    if (!prevUser) return prevUser;
    
                    const groupAlreadyExists = prevUser.groups.some(g => g._id === groupData._id);
                    if (groupAlreadyExists) return prevUser;
    
                    return { ...prevUser, groups: [...prevUser.groups, groupData] };
                });
            };
    
            socket.on("addedToGroup", handleAddedToGroup);
    
            return () => {
                socket.off("addedToGroup", handleAddedToGroup);
            };
        }, []);
    */


    return (


        <View style={styles.container}>


            {/* <FlatList
                data={user?.groups}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (



                    <TouchableOpacity onPress={() => navigation.navigate("GroupChatScreen", {
                        groupId: item._id,
                        groupName: item.name,
                        groupPhoto: item.photo,
                        groupdescription: item.description,
                        groupcreator: item.creator,
                        groupadmins: item.admins,
                        groupmembers: item.members,
                    })}>

                        <View style={styles.chatItem}>
                            <Image source={{ uri: item.photo }} style={styles.profilePic} />
                            <View style={styles.chatDetails}>
                                <Text style={styles.name}>{item.name}</Text>

                                {item?.lastMessage &&
                                    <Text style={styles.message}>
                                        {Array.isArray(item?.lastMessage) ? "document" : item?.lastMessage}
                                    </Text>
                                }

                            </View>

                            {item?.lastMessageTime && <Text style={styles.time}>{formatTime(item?.lastMessageTime)}</Text>}

                        </View>
                    </TouchableOpacity>
                )}
            /> */}


            <FlatList
                data={user?.groups}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {

                    const hasLeft = item.leftUsers?.some(
                        (leftUser: any) => leftUser.user?.toString() === user?.user._id?.toString()
                    );

                    return (
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate("GroupChatScreen", {
                                    groupId: item._id,
                                    groupName: item.name,
                                    groupPhoto: item.photo,
                                    groupdescription: item.description,
                                    groupcreator: item.creator,
                                    groupadmins: item.admins,
                                    groupmembers: item.members,
                                })
                            }
                        >
                            <View style={styles.chatItem}>
                                <Image source={{ uri: item.photo }} style={styles.profilePic} />
                                <View style={styles.chatDetails}>
                                    <Text style={styles.name}>{item.name}</Text>

                                    <Text style={styles.message}>
                                        {hasLeft
                                            ? "You are not a Member"
                                            : Array.isArray(item?.lastMessage)
                                                ? "document"
                                                : item?.lastMessage || ""}
                                    </Text>
                                </View>

                                {!hasLeft && item?.lastMessageTime && (
                                    <Text style={styles.time}>{formatTime(item?.lastMessageTime)}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />


            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>

            <Modal animationType="slide" transparent visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeIcon} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>

                        <ScrollView>
                            <Text style={styles.label}>Group Name</Text>
                            <TextInput style={styles.input} value={formdata.name} onChangeText={(text) => handleChange('name', text)} />


                            <Text style={styles.label}>Description</Text>
                            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                multiline
                                numberOfLines={4} value={formdata.description} onChangeText={(text) => handleChange('description', text)} />

                            <Text style={styles.label}>Select Group Photo</Text>
                            <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
                                <Text style={styles.btnText}>Pick an Image</Text>
                            </TouchableOpacity>

                            {formdata.photo ? (<Image source={{ uri: formdata.photo }} style={styles.previewImage} />) : null}




                            {/* You can enable this later
                            <Text style={styles.label}>Private Group?</Text>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => handleChange('isPrivate', !formData.isPrivate)}
                            >
                                <Text>{formData.isPrivate ? '✅ Yes' : '⬜ No'}</Text>
                            </TouchableOpacity>
                            */}



                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                                <Text style={styles.btnText}>Create Group</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>

    );
};

export default CreateGroupScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // padding: 6,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 50,
        elevation: 5,
    },
    fabText: {
        color: '#fff',
        fontSize: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#000000aa',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 12,
        padding: 20,
        maxHeight: '90%',
        position: 'relative',
    },
    closeIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        padding: 5,
    },
    closeText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
    },
    checkbox: {
        padding: 8,
        marginBottom: 12,
    },
    submitBtn: {
        backgroundColor: '#28a745',
        padding: 14,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 10,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
    },
    imageBtn: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 10,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 12,
        resizeMode: 'cover',
    },


    chatItem: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
    profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
    chatDetails: { flex: 1 },
    name: { fontSize: 16, fontWeight: "bold" },
    message: { color: "#666" },
    time: { color: "#888", fontSize: 12 },
});
