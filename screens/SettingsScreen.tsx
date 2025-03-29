import React from "react";
import { useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/nav";
type NavigationProp = StackNavigationProp<RootStackParamList, "Login">;
import { UserContext } from "@/context/Usercontext";


interface User {

}

const SettingsScreen = () => {

    const navigation = useNavigation<NavigationProp>();


    const userContext = useContext(UserContext);
    if (!userContext) { return; }


    const [users, setUsers] = useState<User | null>(null);

    const { user, loading: userLoading } = userContext;
    if (user) {
        // console.log("22222", user);
        // setUsers(user);
    }





    const [refreshCount, setRefreshCount] = useState(0);
    const [data, setData] = useState(["Initial Data"]);

    const handleRefresh = () => {
        setRefreshCount(refreshCount + 1);
        const newData = [...data, `Refreshed Data ${refreshCount + 1}`];
        setData(newData);
    };


    const handleLogout = async () => {
        try {
            await AsyncStorage.clear();
            Alert.alert("Logout Successful", "You have been logged out.");
            navigation.replace("Login");

        } catch (error) {
            console.error("Error clearing AsyncStorage:", error);
            Alert.alert("Logout Failed", "An error occurred during logout.");
        }
    };

    return (
        <View >
            <TouchableOpacity onPress={handleLogout}>
                <Text>Logout</Text>
            </TouchableOpacity>



            <View >
                <TouchableOpacity onPress={handleRefresh}>
                    <Text >Refresh </Text>
                </TouchableOpacity>
                <Text>Refresh Count: {refreshCount}</Text>
            </View>


        </View>
    );
};

const styles = StyleSheet.create({


});

export default SettingsScreen;