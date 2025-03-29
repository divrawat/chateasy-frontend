import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from '@/screens/SignUpScreen';
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import DashBoard from '@/screens/DashBoard';
import { RootStackParamList } from '@/nav';
import { UserProvider } from '@/context/Usercontext';
import AuthLayout from '@/screens/AuthLayout';


const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <AuthLayout>
      <UserProvider>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DashBoard" component={DashBoard} options={{ headerShown: false }} />
        </Stack.Navigator>
      </UserProvider>
    </AuthLayout>
  );
};


export default App;
