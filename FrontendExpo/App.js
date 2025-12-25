import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar style="auto" />
        <AppNavigator />
      </Provider>
    </SafeAreaProvider>
  );
}
