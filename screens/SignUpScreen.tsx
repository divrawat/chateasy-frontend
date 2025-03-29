import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { sendOtp, verifyOtp } from "../actions/user";
import AuthLayout from "./AuthLayout";

const SignUpScreen = () => {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOtp = async () => {
        if (!phone.trim() || !email.trim()) {
            Alert.alert("Error", "Phone number & Email is required.");
            return;
        }

        try {
            await sendOtp(email, phone);
            setOtpSent(true);
        } catch (error) {
            console.log("Error sending OTP:", error);
        }
    };


    const handleVerifyOtp = () => {
        if (!otp.trim()) {
            Alert.alert("Error", "Phone number is required.");
            return;
        }
        verifyOtp(phone, otp);
    };


    return (
        <AuthLayout>
            <View style={styles.container}>
                {!otpSent ? (
                    <>
                        <Text style={styles.label}>Enter Email Address:</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="email-address"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"

                        />
                        <Text style={styles.label}>Enter Phone Number:</Text>
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
            </View>
        </AuthLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    label: { fontSize: 18, marginBottom: 10 },
    input: { width: "80%", borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 20, borderRadius: 5 },
    button: { backgroundColor: "blue", padding: 15, borderRadius: 5 },
    otpbutton: { backgroundColor: "blue", padding: 15, borderRadius: 5, marginTop: '8%' },
    buttonText: { color: "white", fontSize: 16 },
    otpInput: { borderBottomWidth: 2, borderColor: "#000" },
    otpcontainer: { width: "75%" },
    pinCodeContainer: { width: "20%" }
});

export default SignUpScreen;
