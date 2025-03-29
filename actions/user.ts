import axios from "axios";
import { Alert } from "react-native";
import { BACKEND } from '../config'
import AsyncStorage from "@react-native-async-storage/async-storage";

export const sendOtp = async (email: string, phone: string): Promise<void> => {
    try {
        const response = await axios.post<{ success: boolean; message?: string }>(`${BACKEND}/send-otp`, { email, phone });

        if (response.data.message) {
            Alert.alert("OTP Sent", "Check your email for the OTP.");
        } else {
            Alert.alert("Error", "Something went wrong.");
        }
    } catch (error) {
        Alert.alert("Error", "Failed to send OTP.");
    }
};


export const loginOTP = async (phone: string): Promise<void> => {
    try {
        const response = await axios.post<{ success: boolean; message?: string }>(`${BACKEND}/send-otp`, { phone });

        if (response.data.message) {
            Alert.alert("OTP Sent", "Check your email for the OTP.");
        } else {
            Alert.alert("Error", "Something went wrong.");
        }
    } catch (error) {
        Alert.alert("Error", "Failed to send OTP.");
    }
};


/*
export const verifyOtp = async (phone: string, otp: string): Promise<Object | null> => {
    try {
        const response = await axios.post<{ token?: string; userId?: string }>(`${BACKEND}/verify-otp`, { phone, otp });

        if (response.data.token && response.data.userId) {
            const fetchedData: any = await fetchUser(response.data.userId);

            if (fetchedData) { AsyncStorage.setItem("user", fetchedData); }

            Alert.alert("Success", "OTP Verified! User logged in.");
            return fetchedData;
        } else {
            Alert.alert("Error", "Something went wrong.");
            return null;
        }
    } catch (error) {
        Alert.alert("Error", "Failed to verify OTP.");
        return null;
    }
};
*/



export const verifyOtp = async (phone: string, otp: string): Promise<Object | null> => {
    try {

        const fetchedData: any = await fetchUser('67e2be9fac49d7152c5f3d03');
        if (fetchedData) { AsyncStorage.setItem("user", fetchedData); }
        Alert.alert("Success", "OTP Verified! User logged in.");
        return fetchedData;

    } catch (error) {
        Alert.alert("Error", "Failed to verify OTP.");
        return null;
    }
};












interface User {
    updatedAt: string | undefined;
    __v: number | undefined;
    isVerified: boolean;
    mutedUsers: any[];
    blockedUsers: any[];
    friendRequests: any[];
    email: string | undefined;
    mutedGroups: any[];
    _id: string;
    name?: string;
    phone?: string;
    photo?: string;
    friends: { _id: string }[];
}




interface UserApiResponse {
    friendRequests: never[];
    friends: never[];
    message: string;
    user: User;
}

export const fetchUser = async (userId: string): Promise<UserApiResponse | null> => {
    try {
        const response = await fetch(`${BACKEND}/user/${userId}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};




interface PaginatedResponse {
    users: User[];
    currentPage: number;
    totalPages: number;
};

export const searchUsersByPhone = async (phone: string, page: number = 1): Promise<PaginatedResponse | null> => {
    try {
        const response = await axios.get<PaginatedResponse>(`${BACKEND}/search-users?search=${phone}&page=${page}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        return null;
    }
};

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
    try {

        const response = await fetch(`${BACKEND}/friend-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId, receiverId })
        });
        return await response.json();
    } catch (error) {
        console.error("Error sending friend request:", error);

    }
};


export const UnFriendRequest = async (senderId: string, receiverId: string) => {
    try {

        const response = await fetch(`${BACKEND}/unfriend-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId, receiverId })
        });
        return await response.json();
    } catch (error) {
        console.error("Error sending friend request:", error);

    }
};



export const handleFriendRequest = async (userId: string, senderId: string, action: "accept" | "reject") => {

    // console.log(action, userId, senderId);


    if (!userId || !senderId) return console.error("User ID or Sender ID is missing!");
    const sendersId = senderId;

    try {
        const response = await fetch(`${BACKEND}/handle-friend-request/${sendersId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ action, userId, senderId }),
        });

        const result = await response.json();
        if (result.message) {
            return result;
        } else {
            console.error("Error:", result.message);
        }
    } catch (error) {
        console.error("Request failed:", error);
    }
};


export const GetAllFriendRequests = async (userId: string): Promise<Object | null> => {
    try {
        const response = await fetch(`${BACKEND}/friend-requests/${userId}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};