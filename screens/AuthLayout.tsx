import React, { useEffect, useState, ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/nav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Define props interface for AuthLayout
interface AuthLayoutProps {
    children: ReactNode;
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'DashBoard'>;

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    const navigation = useNavigation<NavigationProp>();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkStoredPhone = async () => {
            try {
                const storedPhone = await AsyncStorage.getItem('user');
                if (storedPhone) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'DashBoard' }],
                    });
                } else {
                    setIsLoading(false); // No user found, loading complete
                }
            } catch (error) {
                console.error('Error checking user:', error);
                setIsLoading(false);
            }
        };

        checkStoredPhone();
    }, [navigation]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <>{children}</>;
};

export default AuthLayout;
