import React, { useContext, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Button, Alert } from 'react-native';
import { UserContext } from '@/context/Usercontext';
import { RemoveAdmins, AddAdmins } from '@/actions/user';
import { refreshUser } from '@/actions/user';

const MakeAdmins = ({ route }: { route: any }) => {
    const { user, setUser } = useContext(UserContext);
    // console.log(user);

    const { groupId, groupcreator, groupadmins } = route.params;
    // console.log(groupmembers);

    const isAdminOrCreator = user?.user._id === groupcreator || groupadmins.includes(user?.user._id);

    const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
    const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);

    const toggleSelection = (id: string, list: string[], setList: any) => {
        if (list.includes(id)) {
            setList(list.filter((item) => item !== id));
        } else {
            setList([...list, id]);
        }
    };



    const handleAddAdmins = async () => {
        const formData = new FormData();
        formData.append('groupId', groupId);
        formData.append('userId', user?.user._id);
        selectedToAdd.forEach((id) => formData.append('userIds[]', id));

        try {
            const response = await AddAdmins(formData);
            if (response.message) {
                Alert.alert('Success', 'Admins Made');
                setSelectedToAdd([]);

                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }


            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add Admin');
        }
    };


    const handleRemoveAdmin = async () => {
        const formData = new FormData();
        formData.append('groupId', groupId);
        formData.append('userId', user?.user._id);
        selectedToRemove.forEach((id) => formData.append('userIds[]', id));

        try {
            const response = await RemoveAdmins(formData);
            if (response.message) {
                Alert.alert('Success', 'Admin removed');
                setSelectedToRemove([]);
                const fetchedData: any = await refreshUser(user?.user._id);
                if (fetchedData) { setUser(fetchedData); }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to remove Admins');
        }
    };



    const currentGroup = user?.groups?.find((group) => group._id === groupId);


    const renderUserCard = (item: any, selectedList: string[], toggleFn: Function, setList: any) => {
        const currentGroup = user?.groups.find((g: any) => g._id === groupId);

        let role = '';
        if (item._id === currentGroup?.creator) {
            role = 'Creator';
        } else if (currentGroup?.admins.some((admin: any) => admin._id === item._id)) {
            role = 'Admin';
        }

        return (
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
                <Image source={{ uri: item.photo }}
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: '#666' }}>{item.phone}</Text>
                </View>

                {role !== '' && (
                    <Text style={{
                        marginLeft: 10, borderWidth: 1,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        fontSize: 11,
                        paddingVertical: 2, borderColor: 'green', color: 'green', fontWeight: 'bold'
                    }}>
                        {role}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };



    return (
        <View style={{ padding: 20, flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Admins</Text>



            <FlatList
                data={currentGroup.admins}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => renderUserCard(item, selectedToRemove, toggleSelection, setSelectedToRemove)}
                ListEmptyComponent={<Text>No members to add.</Text>}
            />

            <Button title="Remove Admins" onPress={handleRemoveAdmin} />



            {isAdminOrCreator && (
                <>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 10 }}>
                        Members
                    </Text>
                    <FlatList

                        data={currentGroup.members}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) =>
                            renderUserCard(item, selectedToAdd, toggleSelection, setSelectedToAdd)
                        }
                        ListEmptyComponent={<Text>This Group currently has no admins.</Text>}
                    />
                    <Button title="Make Admins" color="red" onPress={handleAddAdmins} />
                </>
            )}
        </View>
    );
};

export default MakeAdmins;
