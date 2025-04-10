import React, { createContext, useState, useEffect, ReactNode, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUser } from "@/actions/user";

interface Friend {
    lastMessage: any;
    lastMessageTime: any;
    _id: string;
    name: string;
    email: string;
    phone: string;
    photo: string;
}

interface FriendRequest {
    _id: string;
    status: string;
    sender: Friend;
}

interface User {
    user: any
    _id: string;
    name?: string;
    phone?: string;
    description?: string;
    photo?: string;
    email?: string;
    friends: Friend[];
    friendRequests: FriendRequest[];
    blockedUsers: any[];
    mutedUsers: any[];
    mutedGroups: any[];
    isVerified: boolean;
    __v?: number;
    updatedAt?: string;
}

interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
}

export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
    loading: true,
});

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);



    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("Error loading user from AsyncStorage:", error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    });

    const contextValue = useMemo(() => ({ user, setUser, loading }), [user, loading]);

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};
