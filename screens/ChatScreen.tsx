import React from "react";
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet } from "react-native";

const users = [
    { id: "1", name: "FLUTTER Batch23", message: "+91 90807 69068 added +91 47689...", time: "6:27 PM", profile: "https://randomuser.me/api/portraits/men/1.jpg" },
    { id: "2", name: "Ben", message: "Hi bruh", time: "6:13 PM", profile: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: "3", name: "Betty Manager", message: "Mail it when it's done", time: "5:56 PM", profile: "https://randomuser.me/api/portraits/women/3.jpg" },
    { id: "4", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },

    { id: "5", name: "FLUTTER Batch23", message: "+91 90807 69068 added +91 47689...", time: "6:27 PM", profile: "https://randomuser.me/api/portraits/men/1.jpg" },
    { id: "6", name: "Ben", message: "Hi bruh", time: "6:13 PM", profile: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: "7", name: "Betty Manager", message: "Mail it when it's done", time: "5:56 PM", profile: "https://randomuser.me/api/portraits/women/3.jpg" },
    { id: "8", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },

    { id: "9", name: "FLUTTER Batch23", message: "+91 90807 69068 added +91 47689...", time: "6:27 PM", profile: "https://randomuser.me/api/portraits/men/1.jpg" },
    { id: "10", name: "Ben", message: "Hi bruh", time: "6:13 PM", profile: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: "11", name: "Betty Manager", message: "Mail it when it's done", time: "5:56 PM", profile: "https://randomuser.me/api/portraits/women/3.jpg" },
    { id: "12", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },

    { id: "13", name: "FLUTTER Batch23", message: "+91 90807 69068 added +91 47689...", time: "6:27 PM", profile: "https://randomuser.me/api/portraits/men/1.jpg" },
    { id: "14", name: "Ben", message: "Hi bruh", time: "6:13 PM", profile: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: "15", name: "Betty Manager", message: "Mail it when it's done", time: "5:56 PM", profile: "https://randomuser.me/api/portraits/women/3.jpg" },
    { id: "16", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },


    { id: "160", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "17", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "18", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "19", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "20", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "21", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "22", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "23", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "24", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "25", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "26", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },

    { id: "27", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: "28", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },

    { id: "29", name: "Mom", message: "Had coffee???", time: "5:35 PM", profile: "https://randomuser.me/api/portraits/women/4.jpg" },

];


const ChatsScreen = () => (
    <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <View style={styles.chatItem}>
                <Image source={{ uri: item.profile }} style={styles.profilePic} />
                <View style={styles.chatDetails}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                </View>
                <Text style={styles.time}>{item.time}</Text>
            </View>
        )}
        scrollEnabled={true}  // ✅ Ensure scrolling is enabled
        showsVerticalScrollIndicator={false}  // ✅ Hides scrollbar for smooth effect
        initialNumToRender={5}  // ✅ Loads fewer items initially
        maxToRenderPerBatch={10}  // ✅ Efficient batch rendering
        windowSize={10}  // ✅ Keeps only a few items in memory
        getItemLayout={(data, index) => ({
            length: 70, // ✅ Approximate item height (adjust based on actual)
            offset: 70 * index,
            index,
        })}
    />
);


const styles = StyleSheet.create({
    chatItem: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
    profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
    chatDetails: { flex: 1 },
    name: { fontSize: 16, fontWeight: "bold" },
    message: { color: "#666" },
    time: { color: "#888", fontSize: 12 },
});

export default ChatsScreen