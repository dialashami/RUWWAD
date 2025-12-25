import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>RUWWAD</Text>
        <Text style={styles.subtitle}>Learn Anytime, Anywhere</Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.illustrationContainer}>
          <Text style={styles.illustrationEmoji}>📚</Text>
        </View>
        <Text style={styles.welcomeTitle}>Welcome to RUWWAD</Text>
        <Text style={styles.welcomeDescription}>
          Your gateway to quality education. Connect with teachers, track your progress, and achieve your learning goals.
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupBtn}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signupBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.guestBtnText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007bff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loginBtn: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007bff',
    marginBottom: 12,
  },
  signupBtnText: {
    color: '#007bff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestBtn: {
    padding: 16,
    alignItems: 'center',
  },
  guestBtnText: {
    color: '#666',
    fontSize: 16,
  },
});
