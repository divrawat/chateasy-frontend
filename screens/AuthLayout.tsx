import React from 'react';
import { useEffect } from 'react';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/nav";
import AsyncStorage from "@react-native-async-storage/async-storage";
type NavigationProp = StackNavigationProp<RootStackParamList, "DashBoard">;


const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigation = useNavigation<NavigationProp>();
    const checkStoredPhone = async () => {
        const storedPhone = await AsyncStorage.getItem("authToken");
        if (storedPhone) { navigation.replace("DashBoard"); }
    };
    useEffect(() => { checkStoredPhone() }, []);
    return <>{children}</>
}

export default AuthLayout;