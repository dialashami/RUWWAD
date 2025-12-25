/**
 * RUWWAD - React Native Mobile App
 * Educational Platform for Students, Teachers, and Parents
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { checkAuth } from './src/store/authSlice';

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is already logged in
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#fff'}
      />
      <AppNavigator />
    </>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppContent />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
