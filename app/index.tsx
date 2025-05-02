import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from '@/screens/SignUpScreen';
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import DashBoard from '@/screens/DashBoard';
import { RootStackParamList } from '@/nav';
import { UserProvider } from '@/context/Usercontext';
import AuthLayout from '@/screens/AuthLayout';
import ChatScreen from '@/screens/ChatScreen';
import GroupChatScreen from '@/screens/GroupChatScreen';
import GroupInfoScreen from '@/screens/GroupInfo';
import AddRemoveMembers from '@/screens/AddRemoveMembers';
import MakeAdmins from '@/screens/MakeAdmins';
import { View, Image, Text } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {


  return (
    <AuthLayout>
      <UserProvider>
        <Stack.Navigator initialRouteName='Login'>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DashBoard" component={DashBoard} options={{ headerShown: false }} />


          <Stack.Screen name="ChatScreen" component={ChatScreen}
            options={({ route, navigation }) => ({
              headerTitle: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image source={{ uri: route.params?.userPhoto }}
                    style={{ width: 35, height: 35, borderRadius: 17.5, marginRight: 10 }} />
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>{route.params?.userName}</Text>
                </View>
              ),
            })}
          />


          <Stack.Screen name="GroupChatScreen" component={GroupChatScreen}
            options={({ route, navigation }) => ({
              headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={{ uri: route.params?.groupPhoto }}
                    style={{ width: 35, height: 35, borderRadius: 17.5, marginRight: 10, }} />
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{route.params?.groupName} </Text>
                </View>
              )
            })}
          />



          <Stack.Screen name="GroupInfoScreen" component={GroupInfoScreen}
            options={() => ({
              headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Group Info
                  </Text>
                </View>
              )
            })}
          />


          <Stack.Screen name="AddRemoveMembers" component={AddRemoveMembers}
            options={() => ({
              headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Add Or Remove Members
                  </Text>
                </View>
              )
            })}
          />


          <Stack.Screen name="MakeAdmins" component={MakeAdmins}
            options={() => ({
              headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Make Admins
                  </Text>
                </View>
              )
            })}
          />



        </Stack.Navigator>
      </UserProvider>
    </AuthLayout>
  );
};



export default App;
