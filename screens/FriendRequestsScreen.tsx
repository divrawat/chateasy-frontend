import React, { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, FlatList, StyleSheet, Image, TouchableOpacity } from "react-native";
import { searchUsersByPhone, sendFriendRequest, handleFriendRequest, UnFriendRequest, GetAllFriendRequests } from "@/actions/user";
import { UserContext } from "@/context/Usercontext";
import { FontAwesome } from "@expo/vector-icons";
import socket from "../socket";

interface User {
    friendRequests: any;
    _id: string;
    name?: string;
    phone?: string;
    photo?: string;
    friends: { _id: string }[];
}

const FriendRequestsScreen: React.FC = () => {
    const [phone, setPhone] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [friendrequests, setfriendrequests] = useState<any[]>([]);


    const [requestSent, setrequestSent] = useState<boolean>();

    const userContext = useContext(UserContext);
    if (!userContext) { return <ActivityIndicator size="large" color="blue" />; }

    const { user, setUser, loading: userLoading } = userContext;
    if (user) { // console.log(JSON.stringify(user, null, 2));
    }

    const handleSearch = async (pageNum: number = 1) => {
        if (!phone.trim()) {
            setError("Please enter a phone number ");
            return;
        }

        setLoading(true);
        setError("");

        const data = await searchUsersByPhone(phone, user?.user._id, pageNum);
        if (data?.users?.length) {
            setUsers(data.users);

            setTotalPages(data.totalPages || 1);
            setPage(data.currentPage || 1);
        } else {
            setError("User not found");
            setUsers([]);
        }

        setLoading(false);
    };

    const handleSendRequest = async (receiverId: string) => {

        if (!user) { alert("User not found!"); return; }

        const response = await sendFriendRequest(user?.user?._id, receiverId);

        if (response.message) {
            alert("Friend request sent!");
            setrequestSent(true);
            handleSearch(1);
        } else {
            alert("Failed to send request.");
            setrequestSent(false);
        }
    };


    const UnSendRequest = async (receiverId: string) => {

        if (!user) { alert("User not found!"); return; }

        const response = await UnFriendRequest(user?.user?._id, receiverId);

        if (response.message) {
            alert("Friend request Unsent!");
            setrequestSent(true);
            handleSearch(1);
        } else {
            alert("Failed to unsend request.");
            setrequestSent(false);
        }
    };


    const getFriendRequests = async () => {
        const response: any = await GetAllFriendRequests(user?.user?._id);
        if (response.friendRequests) {
            setfriendrequests(response.friendRequests);

        } else {
            alert("Failed to get Friend Requests.");
        }
    };



    const handleFriendRequests = async (senderId: string, action: "accept" | "reject") => {
        if (!user) { alert("User not found!"); return; }
        const response = await handleFriendRequest(user?.user?._id, senderId, action);
        if (response.message) {
            if (action === "accept") {
                alert("Friend request accepted!");
                getFriendRequests();

                /*
                                const acceptedFriend = friendrequests.find(req => req.sender._id === senderId);
                                if (acceptedFriend) {
                                    setUser((prev: any) => ({
                                        ...prev,
                                        friends: [...prev.friends, acceptedFriend.sender],
                                    }));
                                }
                                    */



            } else {
                alert("Friend request rejected!");
                getFriendRequests();
            }
        } else {
            alert("Something went wrong!");
        }
    };


    useEffect(() => {
        getFriendRequests();

        const ReceiveFriendRequest = (data: any) => {
            setfriendrequests((prevRequests: any) => {

                if (data.sender._id == user?.user._id) { return; }

                const alreadyExists = prevRequests?.some((req: any) => req.sender._id === data.sender._id);
                if (alreadyExists) return prevRequests;

                return [...prevRequests, { sender: data.sender, status: "pending", },];
            });
        };


        const CancelFriendRequest = (data: any) => {
            setfriendrequests((prevRequests) =>
                prevRequests?.filter((req) => req.sender._id !== data.sender._id)
            );
        };



        socket.on("friendRequestReceived", ReceiveFriendRequest);
        socket.on("friendRequestCanceled", CancelFriendRequest);
        return () => {
            socket.off("friendRequestReceived", ReceiveFriendRequest);
            socket.off("friendRequestCanceled", CancelFriendRequest);
        };
    }, []);




    return (
        <View style={styles.container}>
            <Text style={styles.title}>Search Friends</Text>

            <View style={styles.SearchContainer}>

                <TextInput placeholder="Search Number" placeholderTextColor="#ccc" style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(1)}>
                    <FontAwesome name="search" size={20} color="white" />
                </TouchableOpacity>
            </View>


            {loading || userLoading ? <ActivityIndicator size="large" color="blue" style={styles.loader} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FlatList
                data={users}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {

                    const isFriend = user?.friends?.some(friend => friend._id === item._id);

                    const requestSent = item?.friendRequests?.some(
                        (request: any) => request.sender?._id === user?.user._id
                    );



                    return (
                        <View style={styles.chatItem}>
                            <Image source={{ uri: item.photo }} style={styles.profilePic} />
                            <View style={styles.chatDetails}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.name}>{item.phone}</Text>

                                {isFriend ? (
                                    <Text style={styles.friendStatus}>Friends</Text>
                                ) : requestSent ? (
                                    <TouchableOpacity style={styles.requestsent} onPress={() => UnSendRequest(item._id)}>
                                        <Text style={styles.requestButtonText}>Request Sent</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.requestButton} onPress={() => handleSendRequest(item._id)}>
                                        <Text style={styles.requestButtonText}>Send Friend Request</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            <View style={styles.pagination}>
                <Button title="Previous" onPress={() => handleSearch(page - 1)} disabled={page <= 1} />
                <Text>{`${page} / ${totalPages}`}</Text>
                <Button title="Next" onPress={() => handleSearch(page + 1)} disabled={page >= totalPages} />
            </View>




            {friendrequests &&
                <View>
                    <Text style={styles.title}>Friend Requests</Text>


                    <FlatList
                        data={friendrequests}
                        keyExtractor={(req) => req._id}
                        renderItem={({ item }) => (
                            <View style={styles.requestCard}>
                                {item.sender ? (
                                    <>
                                        <Image source={{ uri: item.sender.photo }} style={styles.avatar} />
                                        <View style={styles.userInfo}>
                                            <Text style={styles.name}>{item.sender.name}</Text>
                                            <Text style={styles.phone}>{item.sender.phone}</Text>
                                        </View>



                                        <View style={styles.buttonContainer}>
                                            <TouchableOpacity style={styles.acceptButton}
                                                onPress={() => handleFriendRequests(item.sender._id, "accept")}
                                            >
                                                <Text style={styles.buttonText}>Accept</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.rejectButton}
                                                onPress={() => handleFriendRequests(item.sender._id, "reject")}
                                            >
                                                <Text style={styles.buttonText}>Reject</Text>
                                            </TouchableOpacity>
                                        </View>


                                    </>
                                ) : (
                                    <Text style={styles.noSender}>Unknown Sender</Text>
                                )}
                            </View>
                        )}
                    />

                </View>
            }



        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },

    SearchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 15,
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 15,
        fontSize: 16,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        backgroundColor: "#fff",
    },
    searchButton: {
        backgroundColor: "#008C8C",
        padding: 15,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },



    title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    loader: { marginTop: 20 },
    error: { color: "red", marginTop: 10 },
    pagination: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
    chatItem: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
    profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
    chatDetails: { flex: 1 },
    name: { fontSize: 16, },
    friendStatus: { fontSize: 14, color: "gray", marginTop: 2 },
    requestsent: { fontSize: 14, color: "white", marginTop: 5, paddingLeft: 10, paddingRight: 10, paddingBottom: 5, paddingTop: 5, borderRadius: 5, textAlign: "center", width: 120, backgroundColor: "#075E54" },
    requestButton: { width: 180, backgroundColor: "#075E54", padding: 8, borderRadius: 5, marginTop: 5, paddingLeft: 10, paddingRight: 10, paddingBottom: 5, paddingTop: 5, },
    requestButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },







    noRequests: {
        textAlign: "center",
        fontSize: 16,
        color: "gray",
    },
    requestCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    userInfo: {
        flex: 1,
    },
    phone: {
        fontSize: 14,
        color: "gray",
    },
    status: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#007bff",
    },
    noSender: {
        color: "red",
        fontStyle: "italic",
    },

    buttonContainer: {
        flexDirection: "row",
        gap: 10,
    },
    acceptButton: {
        backgroundColor: "#008C8C",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    rejectButton: {
        backgroundColor: "red",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },

});

export default FriendRequestsScreen;
