import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';

// Home Screens
import StudentHomeScreen from '../screens/StudentHomeScreen';
import TeacherHomeScreen from '../screens/TeacherHomeScreen';
import ParentHomeScreen from '../screens/ParentHomeScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />

        {/* Main App Screens */}
        <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
        <Stack.Screen name="TeacherHome" component={TeacherHomeScreen} />
        <Stack.Screen name="ParentHome" component={ParentHomeScreen} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
