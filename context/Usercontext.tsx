import React, { createContext, useState, useEffect, ReactNode, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from "../socket";

interface Friend {
    mutedUsers: any;
    groups: any;
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
    groups: any[];
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
        if (!user) return;
        socket.emit("userOnline", user.user._id);
        socket.emit("joinRoom", user?.user._id);
        user.groups.forEach((group: any) => { socket.emit('joinRoom', `group_${group._id}`); });
        user.friends.forEach((friend: any) => {
            const roomId = `chat_${[user?.user._id, friend._id].sort().join('_')}`;
            socket.emit('joinRoom', roomId);
        });


        const handleGroupRemove = (data: any) => {
            if (data.type === "leave" && data.user?._id && data.groupId) {
                setUser((prevUser: any) => {
                    if (!prevUser) return prevUser;

                    const updatedGroups = prevUser.groups.map((group: any) => {
                        if (group._id !== data.groupId) return group;

                        return {
                            ...group,
                            members: group.members?.filter((m: any) => m._id !== data.user._id),
                            admins: group.admins?.filter((a: any) => a._id !== data.user._id),
                            leftUsers: [
                                ...(group.leftUsers || []),
                                {
                                    user: data.user._id,
                                    leftAt: data.leftAt || new Date(),
                                },
                            ],
                        };
                    });

                    const newUser = { ...prevUser, groups: updatedGroups, };

                    // console.log("✅ Updated User Groups:", JSON.stringify(newUser.groups, null, 2));

                    return newUser;
                });
            }
        };


        const handleAddedToGroup = (groupData: any) => {
            setUser((prevUser) => {
                if (!prevUser) return prevUser;

                let updatedGroups = [...prevUser.groups];

                // Step 1: Add group if not present
                const groupExists = updatedGroups.some(group => group._id === groupData._id);
                if (!groupExists) {
                    updatedGroups.push({
                        ...groupData,
                        members: [] // Start with an empty members array
                    });
                }

                // Step 2: Add members to that group
                updatedGroups = updatedGroups.map(group => {
                    if (group._id === groupData._id) {
                        const existingMemberIds = (group.members || []).map((m: any) => m._id || m);
                        const newMemberIds = groupData.members.filter((id: any) => !existingMemberIds.includes(id));
                        return {
                            ...group,
                            members: [...(group.members || []), ...newMemberIds]
                        };
                    }
                    return group;
                });

                return { ...prevUser, groups: updatedGroups };
            });

            // console.log("Group:", JSON.stringify(groupData, null, 2));
        };

        // console.log(JSON.stringify(user?.groups, null, 2));

        const handleRemovedFromGroup = (updatedGroup: any) => {
            console.log(updatedGroup.name);

            setUser((prevUser: any) => {
                if (!prevUser) return prevUser;

                const updatedGroups = prevUser.groups.map((group: any) => {
                    if (group._id !== updatedGroup._id) return group;

                    return {
                        ...group,
                        members: updatedGroup.members,
                        admins: updatedGroup.admins || [],
                        leftUsers: updatedGroup.leftUsers || [],
                    };
                });

                return {
                    ...prevUser,
                    groups: updatedGroups,
                };
            });
        };

        const handleMessage = (message: any) => {

            const messageContent = message.messageContent;

            const lastMessageContentUrl = Array.isArray(messageContent)
                ? messageContent[messageContent.length - 1] : messageContent;

            const isGif = typeof lastMessageContentUrl === 'string' && lastMessageContentUrl.endsWith('.gif');

            const isImage = typeof lastMessageContentUrl === 'string' &&
                (lastMessageContentUrl.endsWith('.jpg') ||
                    lastMessageContentUrl.endsWith('.jpeg') ||
                    lastMessageContentUrl.endsWith('.png') ||
                    lastMessageContentUrl.endsWith('.webp'));

            const displayMessage = isGif ? 'gif' : isImage ? 'photo' : Array.isArray(messageContent) ? 'document' : messageContent;

            setUser((prevUser) => {
                if (!prevUser?.friends) return prevUser;

                const updatedFriends = prevUser.friends.map((friend) =>
                    friend._id === message.sender
                        ? {
                            ...friend,
                            lastMessage: displayMessage,
                            lastMessageTime: message.createdAt,
                        }
                        : friend
                );
                return { ...prevUser, friends: updatedFriends };
            });
        };

        const handleGroupMessage = (message: any) => {

            const isMember = user?.groups?.some(group =>
                group.members?.some((member: { _id: any; }) => member._id === message.receiver)
            );

            if (!isMember) { return; }

            const messageContent = message.messageContent;

            const lastMessageContentUrl = Array.isArray(messageContent)
                ? messageContent[messageContent.length - 1] : messageContent;

            const isGif = typeof lastMessageContentUrl === 'string' && lastMessageContentUrl.endsWith('.gif');

            const isImage = typeof lastMessageContentUrl === 'string' &&
                (lastMessageContentUrl.endsWith('.jpg') ||
                    lastMessageContentUrl.endsWith('.jpeg') ||
                    lastMessageContentUrl.endsWith('.png') ||
                    lastMessageContentUrl.endsWith('.webp'));

            const displayMessage = isGif ? 'gif' : isImage ? 'photo' : Array.isArray(messageContent) ? 'document' : messageContent;

            setUser((prevUser) => {
                if (!prevUser?.groups) return prevUser;

                const updatedgroups = prevUser.groups.map((group) =>
                    group._id === message.group
                        ? {
                            ...group,
                            lastMessage: displayMessage,
                            lastMessageTime: message.createdAt,
                        }
                        : group
                );
                return { ...prevUser, groups: updatedgroups };
            });
        };



        const FriendRequestAccepted = (data: any) => {
            const currentUserId = user?.user?._id;

            if (!currentUserId || !data?.sender || !data?.receiver) return;

            const otherUser = currentUserId === data.sender._id ? data.receiver : data.sender;

            setUser((prevUser: any) => {
                if (!prevUser) return prevUser;

                const alreadyFriend = prevUser.friends.some((friend: any) => {
                    const friendId = typeof friend === "string" ? friend : friend._id;
                    return friendId === otherUser._id;
                });

                if (alreadyFriend) return prevUser;

                return {
                    ...prevUser,
                    friends: [...prevUser.friends, otherUser],
                };
            });
        };








        socket.on("receiveMessage", handleMessage);
        socket.on("addedToGroup", handleAddedToGroup);
        socket.on("RemovedFromGroup", handleRemovedFromGroup);
        socket.on("receiveGroupMessage", handleGroupMessage);
        socket.on("groupUpdated", handleGroupRemove);
        socket.on("friendRequestAccepted", FriendRequestAccepted);


        return () => {

            socket.off("groupUpdated", handleGroupRemove);
            socket.off("addedToGroup", handleAddedToGroup);
            socket.off("RemovedFromGroup", handleRemovedFromGroup);
            socket.off("receiveMessage", handleMessage);
            socket.off("receiveGroupMessage", handleGroupMessage);
            socket.off("friendRequestAccepted", FriendRequestAccepted);
        };
    }, [user]);







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
