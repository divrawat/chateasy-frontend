import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { UserContext } from "@/context/Usercontext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND } from "@/config";
import { Image } from 'expo-image';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/nav";


type NavigationProp = StackNavigationProp<RootStackParamList, "Login">;

const ProfileScreen: React.FC = () => {


    const navigation = useNavigation<NavigationProp>();


    const { user, setUser } = useContext(UserContext);
    // if (user) { console.log(user); }




    const [name, setName] = useState(user?.user.name || "");
    const [email, setEmail] = useState(user?.user.email || "");
    const [description, setDescription] = useState(user?.user.description || "");
    const [phone, setPhone] = useState(user?.user.phone || "");
    const [profileImage, setProfileImage] = useState(user?.user.photo || "");
    const [uploading, setUploading] = useState(false);



    const pickImage = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "image/*",
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.length) {
                return;
            }

            setProfileImage(result.assets[0].uri); // Update profile image state
        } catch (error) {
            Alert.alert("Error", "Could not pick an image.");
        }
    };




    // Upload File and Profile Data
    const uploadProfile = async () => {
        if (!name || !description) {
            Alert.alert("Please fill in all fields!");
            return;
        }

        setUploading(true);

        const formData = new FormData();
        if (profileImage) {
            formData.append("file", {
                uri: profileImage,
                name: `profile_${user?.user._id}.jpg`,
                type: "image/jpeg",
            } as any);
        }
        formData.append("userId", user?.user._id);
        formData.append("name", name);
        formData.append("description", description);
        formData.append("email", email);

        // console.log(formData);

        try {
            const response = await fetch(`${BACKEND}/upload`, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const data = await response.json();

            if (response.ok) {
                //  setUser({ ...user, name: data.name, description: data.description, photo: data.url });
                setUser((prevUser) =>
                    prevUser
                        ? { ...prevUser, name: data.name, description: data.description, photo: data.url, email: data.email }
                        : null
                );

                Alert.alert("Profile Updated Successfully!");
            } else {
                Alert.alert("Update Failed", data.error || "Something went wrong.");
            }
        } catch (error) {
            Alert.alert("Update Failed", "Please try again later.");
            // console.log('000', error);

        } finally {
            setUploading(false);
        }
    };




    const Logout = async () => {
        await AsyncStorage.clear();

        navigation.replace("Login");
    }



    return (
        <View style={styles.container}>
            {/* Profile Picture */}
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>

                <Image source={profileImage ? { uri: profileImage } : { uri: 'https://media.istockphoto.com/id/1451587807/vector/user-profile-icon-vector-avatar-or-person-icon-profile-picture-portrait-symbol-vector.jpg?s=612x612&w=0&k=20&c=yDJ4ITX1cHMh25Lt1vI1zBn2cAKKAlByHBvPJ8gEiIg=', }} style={styles.profileImage} />


                <View style={styles.cameraIcon}>
                    <Text style={styles.cameraText}>📷</Text>
                </View>
            </TouchableOpacity>


            <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} style={styles.input} />
            </View>


            <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput value={description} onChangeText={setDescription} style={styles.input} />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail} style={styles.input} />
            </View>


            {/* <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone</Text>
                <TextInput value={phone} style={styles.input} editable={false} />
            </View> */}

            {/* Upload Button */}
            {uploading ? (
                <ActivityIndicator size="large" color="#007bff" />
            ) : (
                <TouchableOpacity onPress={uploadProfile} style={styles.button}>
                    <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>
            )}


            <TouchableOpacity onPress={Logout} style={styles.button}>
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>


        </View>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
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

export default ProfileScreen;
