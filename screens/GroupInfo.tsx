import React, { useState, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    FlatList,
    ScrollView
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { UserContext } from "@/context/Usercontext";
import { BACKEND } from "@/config";
import { Image } from "expo-image";
import { refreshUser } from "@/actions/user";

const GroupInfoScreen = ({ route }: { route: any }) => {
    const { user, setUser } = useContext(UserContext);
    // console.log(user);



    const {
        groupName: initialGroupName,
        groupId,
        groupPhoto: initialGroupPhoto,
        groupdescription: initialGroupDescription,
        groupcreator,
        groupadmins,
        groupmembers,
    } = route.params;


    const isAdminOrCreator = user?.user._id === groupcreator || groupadmins.includes(user?.user._id);




    const [groupName, setGroupName] = useState(initialGroupName);
    const [groupdescription, setGroupDescription] = useState(initialGroupDescription);
    const [groupPhoto, setGroupPhoto] = useState(initialGroupPhoto);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "image/*",
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.length) return;

            setGroupPhoto(result.assets[0].uri);
        } catch (error) {
            Alert.alert("Error", "Could not pick an image.");
        }
    };




    const updateGroup = async () => {
        if (!groupName || !groupdescription) {
            Alert.alert("Please fill in all fields!");
            return;
        }

        setUploading(true);

        const formData = new FormData();

        if (groupPhoto) {
            formData.append("file", {
                uri: groupPhoto,
                name: `group_${groupId}.jpg`,
                type: "image/jpeg",
            } as any);
        }




        formData.append("userId", user?.user._id);
        formData.append("groupId", groupId);
        formData.append("groupName", groupName);
        formData.append("groupdescription", groupdescription);

        try {
            const response = await fetch(`${BACKEND}/group/update`, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const data = await response.json();

            if (data.message) {
                Alert.alert("Group Updated Successfully!");
                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }
            } else {
                Alert.alert("Update Failed", data.error || "Something went wrong.");
            }
        } catch (error) {
            Alert.alert("Update Failed", "Please try again later.");
        } finally {
            setUploading(false);
        }
    };


    /*
    const renderUserCard = (item: any) => (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                marginVertical: 5,
                elevation: 1,
            }}
        >
            <Image source={{ uri: item.photo }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }} />
            <View>
                <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                <Text style={{ color: '#666' }}>{item.phone}</Text>
            </View>
        </TouchableOpacity>
    );
*/

    let mycurrentGroup = user?.groups.find((g: any) => g._id === groupId);
    let members = mycurrentGroup.members;
    // console.log(mycurrentGroup);


    const renderUserCard = (item: any) => {
        const currentGroup = user?.groups.find((g: any) => g._id === groupId);

        // console.log(currentGroup.admins);




        let role = '';
        if (item._id === currentGroup?.creator) {
            role = 'Creator';
        } else if (currentGroup?.admins.some((admin: any) => admin._id === item._id)) {
            role = 'Admin';
        }

        return (
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    marginVertical: 5,
                    elevation: 1,
                    backgroundColor: 'white'
                }}
            >
                <Image
                    source={{ uri: item.photo }}
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: '#666' }}>{item.phone}</Text>
                </View>

                {role !== '' && (
                    <Text style={{
                        marginLeft: 10, borderWidth: 1,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        fontSize: 11,
                        paddingVertical: 2, borderColor: 'green', color: role === 'Creator' ? 'green' : 'green', fontWeight: 'bold'
                    }}>
                        {role}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };






    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>


            {isAdminOrCreator &&
                <View style={styles.container}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                        <Image
                            source={
                                groupPhoto
                                    ? { uri: groupPhoto }
                                    : {
                                        uri: "https://media.istockphoto.com/id/1451587807/vector/user-profile-icon-vector-avatar-or-person-icon-profile-picture-portrait-symbol-vector.jpg",
                                    }
                            }
                            style={styles.profileImage}
                        />
                        <View style={styles.cameraIcon}>
                            <Text style={styles.cameraText}>📷</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Group Name</Text>
                        <TextInput value={groupName} onChangeText={setGroupName} style={styles.input} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Group Description</Text>
                        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            multiline
                            numberOfLines={4} value={groupdescription} onChangeText={setGroupDescription} />
                    </View>

                    {uploading ? (
                        <ActivityIndicator size="large" color="#007bff" />
                    ) : (
                        <TouchableOpacity onPress={updateGroup} style={styles.button}>
                            <Text style={styles.buttonText}>Update Group</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.memberContainer}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 10 }}>Group Members</Text>
                        <FlatList data={members} keyExtractor={(item) => item._id}
                            renderItem={({ item }) => renderUserCard(item)}
                            scrollEnabled={false}
                        />
                    </View>
                </View>
            }



            {!isAdminOrCreator &&
                <View style={styles.container}>
                    <TouchableOpacity style={styles.imageContainer}>
                        <Image source={groupPhoto} style={styles.profileImage} />
                        <View style={styles.cameraIcon}>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{groupName}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{groupdescription}</Text>
                    </View>


                    <View style={styles.memberContainer}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 10 }}>Group Members</Text>
                        <FlatList data={members} keyExtractor={(item) => item._id}
                            renderItem={({ item }) => renderUserCard(item)} scrollEnabled={false}
                        />
                    </View>
                </View>
            }









        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,

    },
    container: {
        flex: 1,
        padding: 30,
        alignItems: "center",
        backgroundColor: "#f8f9fa",
    },
    imageContainer: {
        position: "relative",
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: "hidden",
        marginBottom: 20,
    },
    profileImage: {
        width: "100%",
        height: "100%",
        borderRadius: 60,
    },
    cameraIcon: {
        position: "absolute",
        bottom: 5,
        right: 5,
        backgroundColor: "#007bff",
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    cameraText: {
        fontSize: 18,
        color: "white",
    },
    inputContainer: {
        width: "100%",
        marginBottom: 15,
    },
    memberContainer: {
        width: "100%",

    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    input: {
        backgroundColor: "white",
        padding: 10,
        borderRadius: 5,
        borderColor: "#ddd",
        borderWidth: 1,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#075E54",
        padding: 12,
        borderRadius: 5,
        marginTop: 20,
        width: "100%",
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default GroupInfoScreen;