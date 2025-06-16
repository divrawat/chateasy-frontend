import React, { useState, useEffect, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { verifyOtp, loginOTP } from "../actions/user";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/nav";
import { UserContext } from "@/context/Usercontext";
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = StackNavigationProp<RootStackParamList, "DashBoard">;


const LoginScreen = () => {

    async function check() {
        const storedPhone = await AsyncStorage.getItem('user');
        console.log(storedPhone);
    }

    useEffect(() => {
        check();

    }, [])

    const navigation = useNavigation<NavigationProp>();

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOtp = async () => {
        if (!phone.trim()) { Alert.alert("Error", "Phone number & Email is required."); return; }

        try {
            await loginOTP(phone);

            /*
            const fetchedData: any = await verifyOtp(phone, otp);
            if (fetchedData) {
                setUser(fetchedData);
                navigation.replace("DashBoard");
            }
                */

            setOtpSent(true);
        } catch (error) {
            console.log("Error sending OTP:", error);
        }
    };


    const userContext = useContext(UserContext);
    if (!userContext) { return; }
    const { user, setUser, loading: userLoading } = userContext;


    const handleVerifyOtp = async () => {
        if (!otp.trim()) {
            Alert.alert("Error", "OTP is required.");
            return;
        }

        const fetchedData: any = await verifyOtp(phone, otp);


        if (fetchedData) {
            setUser(fetchedData);
            navigation.replace("DashBoard");
        }

    };


    return (


        <View style={styles.container}>
            {!otpSent ? (
                <>
                    <View style={{ paddingBottom: 20 }}>
                        <Image source={require('../assets/images/logo.png')} style={{ width: 100, height: 100 }} />
                    </View>
                    <Text style={styles.label}>Enter Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="phone-pad"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChangeText={setPhone}
                    />
                    <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
                        <Text style={styles.buttonText}>Send OTP</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <View style={{ paddingBottom: 20 }}>
                        <Image source={require('../assets/images/logo.png')} style={{ width: 100, height: 100 }} />
                    </View>
                    <Text style={styles.label}>Enter OTP</Text>
                    <OtpInput
                        numberOfDigits={4}
                        type="numeric"
                        focusStickBlinkingDuration={500}
                        autoFocus={true}
                        onTextChange={setOtp}
                        theme={{
                            containerStyle: styles.otpcontainer,
                            pinCodeContainerStyle: styles.pinCodeContainer,
                        }}
                    />
                    <TouchableOpacity style={styles.otpbutton} onPress={handleVerifyOtp}>
                        <Text style={styles.buttonText}>Verify OTP</Text>
                    </TouchableOpacity>
                </>
            )}


            {/* <Text style={styles.label}>Enter Phone Number:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChangeText={setPhone}
                />
                <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
                    <Text style={styles.buttonText}>Send OTP</Text>
                </TouchableOpacity> */}
        </View>

    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    label: { fontSize: 18, marginBottom: 10 },
    input: { width: "80%", borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 20, borderRadius: 5 },
    button: { backgroundColor: "#36bc84", padding: 15, borderRadius: 5 },
    otpbutton: { backgroundColor: "#36bc84", padding: 15, borderRadius: 5, marginTop: '8%' },
    buttonText: { color: "white", fontSize: 16 },
    otpInput: { borderBottomWidth: 2, borderColor: "#000" },
    otpcontainer: { width: "75%" },
    pinCodeContainer: { width: "20%" }
});

export default LoginScreen;
