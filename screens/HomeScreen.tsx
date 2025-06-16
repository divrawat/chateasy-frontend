import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/nav";
type NavigationProp = StackNavigationProp<RootStackParamList, "DashBoard">;


const HomeScreen: React.FC<{ navigation: any }> = () => {

    const navigation = useNavigation<NavigationProp>();


    return (


        <View style={styles.container}>
            <View style={{ paddingBottom: 20 }}>
                <Image source={require('../assets/images/logo.png')} style={{ width: 100, height: 100 }} />
            </View>
            <Text style={styles.title}>Welcome To CheatEasy</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.replace('Login')}
            >
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>

    )

}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#36bc84',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 10,
        width: 150,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default HomeScreen;