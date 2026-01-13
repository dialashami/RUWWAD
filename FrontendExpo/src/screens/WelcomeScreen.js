import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import api, { feedbackAPI } from '../services/api';

const { width } = Dimensions.get('window');

// Default testimonials
const defaultTestimonials = [
  {
    comment: "RUWWAD has transformed how I manage my classroom and communicate with parents",
    rating: 5,
    author: { firstName: "Sarah", lastName: "Hamad", role: "teacher" }
  },
  {
    comment: "As a parent, I can easily track my child's progress and stay connected with teachers",
    rating: 5,
    author: { firstName: "Hamza", lastName: "Suleiman", role: "parent" }
  },
  {
    comment: "The platform makes learning fun and accessible. I love the interactive lessons",
    rating: 4,
    author: { firstName: "Rand", lastName: "Qasem", role: "student" }
  }
];

const userTypes = [
  {
    id: 1,
    title: "Student",
    description: "Access lessons and learning materials",
    icon: "👨‍🎓",
    role: "student",
  },
  {
    id: 2,
    title: "Teacher",
    description: "Manage classrooms and deliver lessons",
    icon: "👨‍🏫",
    role: "teacher",
  },
  {
    id: 3,
    title: "Parent",
    description: "Track your children's academic progress",
    icon: "👨‍👩‍👧‍👦",
    role: "parent",
  }
];

const toolkitItems = [
  { name: "Assignments", color: "#FF5C5C" },
  { name: "Zoom", color: "#6C63FF" },
  { name: "Schedule", color: "#4B9EFF" },
  { name: "Chattings", color: "#55D88A" },
  { name: "Videos", color: "#00CFFF" },
  { name: "Notes", color: "#FFB347" },
  { name: "Chart", color: "#A066FF" },
  { name: "Lectures", color: "#FFDC60" },
];

export default function WelcomeScreen({ navigation }) {
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch testimonials
    fetchFeedback();
    
    // Refresh feedback every 5 minutes
    const interval = setInterval(fetchFeedback, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await feedbackAPI.getRandomFeedback(3);
      if (res.data && res.data.length > 0) {
        setTestimonials(res.data);
      }
    } catch (err) {
      console.log('Using default testimonials');
    }
  };

  const handleUserSelect = (user) => {
    navigation.navigate('SignUp', { role: user.role });
  };

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.navLogo}>RUWWAD</Text>
        <View style={styles.navAuth}>
          <TouchableOpacity
            style={styles.navLoginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.navLoginText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navSignupBtn}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.navSignupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.heroTitle}>RUWWAD</Text>
          <Text style={styles.heroSubtitle}>Where education is a shared journey</Text>
          <Text style={styles.heroDescription}>
            Ruwwad is the one platform that unites students, educators, and families to help learners succeed at every stage
          </Text>
        </Animated.View>

        {/* Get Started Section */}
        <View style={styles.getStartedSection}>
          <Text style={styles.sectionTitle}>Get started as</Text>
          <View style={styles.userCards}>
            {userTypes.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => handleUserSelect(user)}
                activeOpacity={0.8}
              >
                <Text style={styles.userIcon}>{user.icon}</Text>
                <View style={styles.userContent}>
                  <Text style={styles.userRole}>{user.title}</Text>
                  <Text style={styles.userDesc}>{user.description}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stay Connected Section */}
        <View style={styles.stayConnectedSection}>
          <View style={styles.chatIcon}>
            <Text style={styles.chatIconText}>💬</Text>
          </View>
          <Text style={styles.connectedTitle}>Stay connected—instantly</Text>
          <Text style={styles.connectedDesc}>
            Messages make it easy to communicate with teachers, families and staff anytime 🌍
          </Text>

          <View style={styles.chatBubbles}>
            <View style={[styles.messageBubble, styles.senderBubble]}>
              <Text style={styles.senderName}>Ali - Mohammed's Parent</Text>
              <Text style={styles.messageText}>
                Mohammed was so proud of the A he got on his science test! Thanks for all your help.
              </Text>
            </View>
            <View style={[styles.messageBubble, styles.receiverBubble]}>
              <Text style={styles.messageTextWhite}>We're so proud! She practiced a ton.</Text>
              <Text style={styles.readTime}>Read 10:20AM</Text>
            </View>
            <View style={[styles.messageBubble, styles.senderBubble]}>
              <Text style={styles.senderName}>Rana - Layan's Parent</Text>
              <Text style={styles.messageText}>
                Elena finally solved that tough math problem she's been stuck on!
              </Text>
            </View>
          </View>
        </View>

        {/* Toolkit Section */}
        <View style={styles.toolkitSection}>
          <Text style={styles.paintIcon}>🎨</Text>
          <Text style={styles.toolkitTitle}>Build the best classroom</Text>
          <Text style={styles.toolkitDesc}>
            From attendance sheets to timers and everything in between, the Teacher Toolkit will save time and energy for what really matters
          </Text>
          <View style={styles.toolIcons}>
            {toolkitItems.map((tool, index) => (
              <View
                key={index}
                style={[styles.toolIcon, { backgroundColor: tool.color }]}
              >
                <Text style={styles.toolName}>{tool.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>What's Ruwwad?</Text>
          <Text style={styles.aboutText}>
            Ruwwad is a comprehensive educational platform that supports learners, educators, and parents at every stage of the educational journey. We provide a unified digital environment that brings together interactive lessons, progress tracking, and communication tools. For students, we offer personalized, flexible learning paths. For teachers, we provide powerful tools to create content and monitor performance. For parents, we ensure transparency and collaboration.
          </Text>
        </View>

        {/* Testimonials/Feedback Section */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.testimonialsTitle}>What Our Users Say</Text>
          <Text style={styles.testimonialsSubtitle}>Real feedback from our community</Text>
          <View style={styles.testimonialsGrid}>
            {testimonials.map((feedback, index) => (
              <View key={feedback._id || index} style={styles.testimonialCard}>
                {/* Star Rating */}
                {feedback.rating && (
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text 
                        key={star} 
                        style={[
                          styles.ratingStar,
                          star <= feedback.rating && styles.ratingStarFilled
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                )}
                <Text style={styles.testimonialText}>"{feedback.comment}"</Text>
                <View style={styles.testimonialAuthor}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.avatarText}>
                      {(feedback.author?.firstName?.[0] || 'A').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>
                      {feedback.author?.firstName || 'Anonymous'} {feedback.author?.lastName || ''}
                    </Text>
                    <Text style={styles.authorRole}>
                      {feedback.author?.role ? feedback.author.role.charAt(0).toUpperCase() + feedback.author.role.slice(1) : 'User'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>RUWWAD</Text>
          <Text style={styles.footerDescription}>
            Empowering education through technology and innovation
          </Text>
          
          <View style={styles.footerLinks}>
            <View style={styles.footerSection}>
              <Text style={styles.footerSectionTitle}>Quick Links</Text>
              <Text style={styles.footerLink}>Features</Text>
              <Text style={styles.footerLink}>About Us</Text>
              <Text style={styles.footerLink}>Contact</Text>
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.footerSectionTitle}>Support</Text>
              <Text style={styles.footerLink}>Help Center</Text>
              <Text style={styles.footerLink}>FAQ</Text>
              <Text style={styles.footerLink}>Community</Text>
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.footerSectionTitle}>Connect</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com')}>
                <Text style={styles.footerLink}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://twitter.com')}>
                <Text style={styles.footerLink}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com')}>
                <Text style={styles.footerLink}>Instagram</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.footerBottom}>
            <Text style={styles.copyright}>© 2025 RUWWAD All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  navAuth: {
    flexDirection: 'row',
    gap: 10,
  },
  navLoginBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'transparent',
  },
  navLoginText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  navSignupBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3498db',
  },
  navSignupText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3498db',
    letterSpacing: 4,
    marginBottom: 15,
  },
  heroSubtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 15,
  },
  heroDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  getStartedSection: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  userCards: {
    gap: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  userContent: {
    flex: 1,
  },
  userRole: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 24,
    color: '#3498db',
  },
  stayConnectedSection: {
    padding: 30,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
  },
  chatIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  chatIconText: {
    fontSize: 30,
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  connectedDesc: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 25,
  },
  chatBubbles: {
    width: '100%',
    gap: 12,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 16,
    maxWidth: '85%',
  },
  senderBubble: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  receiverBubble: {
    backgroundColor: '#3498db',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  messageTextWhite: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  readTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    textAlign: 'right',
  },
  toolkitSection: {
    padding: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  paintIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  toolkitTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  toolkitDesc: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  toolIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  toolIcon: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  toolName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  aboutSection: {
    padding: 30,
    backgroundColor: '#f8fafc',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 26,
    textAlign: 'center',
  },
  testimonialsSection: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  testimonialsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  testimonialsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  testimonialsGrid: {
    gap: 15,
  },
  testimonialCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  ratingStar: {
    fontSize: 18,
    color: '#d1d5db',
    marginRight: 2,
  },
  ratingStarFilled: {
    color: '#fbbf24',
  },
  testimonialText: {
    fontSize: 15,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 15,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  authorRole: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#1f2937',
    padding: 30,
  },
  footerLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  footerDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 25,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  footerSection: {
    alignItems: 'center',
  },
  footerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 6,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 20,
  },
  copyright: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
