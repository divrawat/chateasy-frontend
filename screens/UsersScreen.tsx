import React from "react";
import { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, Alert } from "react-native";
import { GetAllFriends } from "@/actions/user";
import { UserContext } from "@/context/Usercontext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/nav";
import socket from "../socket";


const UsersScreen = () => {

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const userContext = useContext(UserContext);
    const { user, setUser, loading: userLoading } = userContext;


    const formatTime = (isoString: string): string => {
        const date = new Date(isoString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";

        hours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, "0");

        return `${hours}:${formattedMinutes} ${ampm}`;
    };


    const filteredFriends = user?.friends?.filter(
        (friend: any) => !friend?.blockedUsers?.includes(user?.user._id)
    );



    return (

        <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (

                <TouchableOpacity onPress={() => navigation.navigate("ChatScreen", {
                    userId: item._id,
                    userName: item.name,
                    userPhoto: item.photo,
                })}>

                    <View style={styles.chatItem}>
                        <Image source={{ uri: item.photo }} style={styles.profilePic} />
                        <View style={styles.chatDetails}>
                            <Text style={styles.name}>{item.name}</Text>

                            {/* {item?.lastMessage &&
                                <Text style={styles.message}>
                                    {Array.isArray(item?.lastMessage) ? "document" : item?.lastMessage}
                                    {'       '}
                                    {item?.unreadCount > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                                        </View>
                                    )}

                                </Text>
                            } */}

                            {item?.lastMessage && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.message}>
                                        {Array.isArray(item?.lastMessage) ? "document" : item?.lastMessage}
                                    </Text>
                                    {item?.unreadCount > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                                        </View>
                                    )}
                                </View>
                            )}




                        </View>


                        {item?.lastMessageTime && <Text style={styles.time}>{formatTime(item?.lastMessageTime)}</Text>}




                    </View>
                </TouchableOpacity>
            )}
        />

    )
}


const styles = StyleSheet.create({
    chatItem: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
    profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
    chatDetails: { flex: 1 },
    name: { fontSize: 16, fontWeight: "bold" },
    message: { color: "#666" },
    time: { color: "#888", fontSize: 12 },

    unreadBadge: {
        backgroundColor: '#25D366',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 5,
        alignSelf: 'flex-start',
    },

    unreadText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default UsersScreen