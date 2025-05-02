import React, { useContext, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Button, Alert } from 'react-native';
import { UserContext } from '@/context/Usercontext';
import { AddMembers, RemoveMembers } from '@/actions/user';
import { refreshUser } from '@/actions/user';
import { useEffect } from 'react';
import socket from "../socket";

const AddRemoveMembers = ({ route }: { route: any }) => {
    const { user, setUser } = useContext(UserContext);
    // console.log(user);

    const { groupId, groupcreator, groupadmins } = route.params;
    // console.log(groupmembers);



    const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
    const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);

    const isAdminOrCreator =
        user?.user._id === groupcreator || groupadmins.includes(user?.user._id);


    const currentGroup = user?.groups?.find((group) => group._id === groupId);


    const group = user?.groups.find((g: any) => g._id === groupId);
    const memberIdsInGroup = group ? group.members.map((member: any) => member._id.toString()) : [];
    const friendsNotInGroup = user?.friends.filter(friend => {
        return !memberIdsInGroup.includes(friend._id.toString());
    });


    // console.log(friendsNotInGroup);
    // console.log(JSON.stringify(user?.friends, null, 2));



    const toggleSelection = (id: string, list: string[], setList: any) => {
        if (list.includes(id)) {
            setList(list.filter((item) => item !== id));
        } else {
            setList([...list, id]);
        }
    };


    const handleAdd = async () => {
        const formData = new FormData();
        formData.append('groupId', groupId);
        formData.append('userId', user?.user._id);
        selectedToAdd.forEach((id) => formData.append('userIds[]', id));

        try {
            const response = await AddMembers(formData);

            if (response.message) {
                Alert.alert('Success', 'Members added');
                setSelectedToAdd([]);

                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) {
                    setUser(fetchedData);
                }

            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add members');
        }
    };


    const handleRemove = async () => {
        const formData = new FormData();
        formData.append('groupId', groupId);
        formData.append('userId', user?.user._id);
        selectedToRemove.forEach((id) => formData.append('userIds[]', id));

        try {
            const response = await RemoveMembers(formData);
            if (response.message) {
                Alert.alert('Success', 'Members removed');
                setSelectedToRemove([]);
                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to remove members');
        }
    };





    const renderUserCard = (item: any, selectedList: string[], toggleFn: Function, setList: any) => (
        <TouchableOpacity
            onPress={() => toggleFn(item._id, selectedList, setList)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: selectedList.includes(item._id) ? '#d0f0c0' : '#fff',
                padding: 10,
                borderRadius: 8,
                marginVertical: 5,
                elevation: 1,
            }}
        >
            <Image source={{ uri: item.photo }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }} />
            <View>
                <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                <Text style={{ color: '#666' }}>{item.phone}</Text>
            </View>
        </TouchableOpacity>
    );






    return (
        <View style={{ padding: 20, flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Add Friends to Group</Text>

            <FlatList
                data={friendsNotInGroup}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) =>
                    renderUserCard(item, selectedToAdd, toggleSelection, setSelectedToAdd)
                }
                ListEmptyComponent={<Text>No friends available to add.</Text>}
            />

            <Button title="Add Selected Friends" onPress={handleAdd} />

            {isAdminOrCreator && (
                <>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 10 }}>
                        Remove Group Members
                    </Text>
                    <FlatList
                        data={currentGroup.members}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) =>
                            renderUserCard(item, selectedToRemove, toggleSelection, setSelectedToRemove)
                        }
                        ListEmptyComponent={<Text>No members to remove.</Text>}
                    />
                    <Button title="Remove Selected Members" color="red" onPress={handleRemove} />
                </>
            )}
        </View>
    );
};

export default AddRemoveMembers;
