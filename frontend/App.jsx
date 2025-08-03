import { ScreenContent } from 'components/ScreenContent';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

import './global.css';
import LoginScreen from 'screens/LoginScreen';
import HomeScreen from'screens/HomeScreen';
import RegisterScreen from 'screens/RegisterScreen';
import UploadIDScreen from 'screens/UploadIDScreen';
import TakeSelfieScreen from 'screens/TakeSelfieScreen';
import VerificationResultScreen from 'screens/VerificationResultScreen';
import VotingScreen from 'screens/VotingScreen';
import VotingResultScreen from 'screens/VotingResultScreen';



const Stack = createStackNavigator();

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login'>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen}   />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="TakeSelfie" component={TakeSelfieScreen} />
        <Stack.Screen name="UploadID" component={UploadIDScreen} />
        <Stack.Screen name="VerificationResult" component={VerificationResultScreen} />
        <Stack.Screen name="Voting" component={VotingScreen} />
        <Stack.Screen name="VotingResult" component={VotingResultScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;  

