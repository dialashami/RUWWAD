import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

/**
 * A wrapper component that handles keyboard visibility across the app.
 * Ensures input fields are visible when the keyboard appears.
 * 
 * Usage:
 * <KeyboardAwareWrapper>
 *   <YourContent />
 * </KeyboardAwareWrapper>
 */
export default function KeyboardAwareWrapper({ 
  children, 
  style, 
  behavior,
  keyboardVerticalOffset = 0,
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={behavior || (Platform.OS === 'ios' ? 'padding' : 'height')}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
