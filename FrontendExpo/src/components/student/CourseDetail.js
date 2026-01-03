import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { courseAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function CourseDetail({ course, onClose, onCourseComplete }) {
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState({
    urls: [],
    uploaded: [],
  });
  const [activeVideoIndex, setActiveVideoIndex] = useState(null);
  const [activeVideoType, setActiveVideoType] = useState(null); // 'url' or 'uploaded'
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Get the course ID (handle both id and _id)
  const courseId = course._id || course.id;

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    } else {
      // No valid course ID, just use the passed course data
      setCourseData(course);
      setLoading(false);
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      // Get student ID
      const userStr = await AsyncStorage.getItem('user');
      let sId = null;
      if (userStr) {
        const userData = JSON.parse(userStr);
        sId = userData._id || userData.id;
        setStudentId(sId);
      }

      console.log('Loading course with ID:', courseId, 'studentId:', sId);

      // Check if courseId looks valid (MongoDB ObjectId is 24 hex chars)
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(courseId);
      
      if (!isValidMongoId) {
        console.log('Invalid MongoDB ID format, using passed course data');
        setCourseData(course);
        setLoading(false);
        return;
      }

      // Fetch course with progress
      const response = await courseAPI.getCourseWithProgress(courseId, sId);
      if (response.data) {
        setCourseData(response.data);
        setProgress(response.data.progress || 0);
        setIsCompleted(response.data.isCompleted || false);
        
        if (response.data.studentVideoProgress) {
          setWatchedVideos({
            urls: response.data.studentVideoProgress.watchedVideoUrls || [],
            uploaded: response.data.studentVideoProgress.watchedUploadedVideos || [],
          });
        }
      }
    } catch (err) {
      console.error('Error loading course:', err);
      // Fallback to basic course data
      setCourseData(course);
    } finally {
      setLoading(false);
    }
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(ytRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  // Check if video is watched
  const isVideoWatched = (videoUrl, type) => {
    if (type === 'url') {
      return watchedVideos.urls.includes(videoUrl);
    }
    return watchedVideos.uploaded.includes(videoUrl);
  };

  // Mark video as watched
  const handleMarkVideoWatched = async (videoUrl, videoType) => {
    if (!studentId) return;

    try {
      const response = await courseAPI.markVideoWatched(courseId, {
        studentId,
        videoUrl,
        videoType,
      });

      if (response.data) {
        setWatchedVideos({
          urls: response.data.watchedVideoUrls || [],
          uploaded: response.data.watchedUploadedVideos || [],
        });
        setProgress(response.data.progress || 0);
        
        if (response.data.isCompleted && !isCompleted) {
          setIsCompleted(true);
          Alert.alert(
            '🎉 Course Completed!',
            `Congratulations! You have completed "${courseData?.title || course.title}"!`,
            [{ text: 'Great!', onPress: onCourseComplete }]
          );
        }
      }
    } catch (err) {
      console.error('Error marking video as watched:', err);
    }
  };

  // Open video in full screen or play inline
  const handlePlayVideo = (index, type) => {
    setActiveVideoIndex(index);
    setActiveVideoType(type);
  };

  // Close video player
  const handleCloseVideo = () => {
    setActiveVideoIndex(null);
    setActiveVideoType(null);
  };

  // Open external link
  const handleOpenExternal = (url) => {
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  const data = courseData || course;
  const videoUrls = data.videoUrls || [];
  const uploadedVideos = data.uploadedVideos || [];
  const totalVideos = videoUrls.length + uploadedVideos.length;
  const hasVideos = totalVideos > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.subject} • {data.grade}</Text>
          {data.teacher && (
            <Text style={styles.teacher}>
              Teacher: {data.teacher.firstName} {data.teacher.lastName}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Course Progress</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Course Completed</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        {data.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{data.description}</Text>
          </View>
        )}

        {/* Zoom Link */}
        {data.zoomLink && (
          <TouchableOpacity 
            style={styles.zoomSection}
            onPress={() => handleOpenExternal(data.zoomLink)}
          >
            <Text style={styles.zoomIcon}>📹</Text>
            <View style={styles.zoomInfo}>
              <Text style={styles.zoomTitle}>Live Session</Text>
              <Text style={styles.zoomLink}>Join Zoom Meeting</Text>
            </View>
            <Text style={styles.zoomArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Videos Section */}
        <View style={styles.videosSection}>
          <Text style={styles.sectionTitle}>
            Course Videos ({totalVideos})
          </Text>

          {!hasVideos ? (
            <View style={styles.noVideos}>
              <Text style={styles.noVideosIcon}>🎬</Text>
              <Text style={styles.noVideosText}>No videos available yet</Text>
              <Text style={styles.noVideosSubtext}>
                Check back later for video content
              </Text>
            </View>
          ) : (
            <>
              {/* Video URLs (YouTube, etc.) */}
              {videoUrls.map((url, index) => {
                const watched = isVideoWatched(url, 'url');
                const embedUrl = getYouTubeEmbedUrl(url);
                
                return (
                  <View key={`url-${index}`} style={styles.videoCard}>
                    <View style={styles.videoHeader}>
                      <View style={styles.videoTitleRow}>
                        <Text style={styles.videoIndex}>{index + 1}</Text>
                        <Text style={styles.videoTitle}>Video Lesson {index + 1}</Text>
                      </View>
                      {watched && (
                        <View style={styles.watchedBadge}>
                          <Text style={styles.watchedText}>✓ Watched</Text>
                        </View>
                      )}
                    </View>

                    {/* YouTube Embed */}
                    {embedUrl && (
                      <View style={styles.videoPlayer}>
                        <WebView
                          source={{ uri: embedUrl }}
                          style={styles.webview}
                          javaScriptEnabled
                          allowsFullscreenVideo
                        />
                      </View>
                    )}

                    <View style={styles.videoActions}>
                      <TouchableOpacity 
                        style={styles.externalBtn}
                        onPress={() => handleOpenExternal(url)}
                      >
                        <Text style={styles.externalBtnText}>🔗 Open in Browser</Text>
                      </TouchableOpacity>
                      
                      {!watched && (
                        <TouchableOpacity 
                          style={styles.watchedBtn}
                          onPress={() => handleMarkVideoWatched(url, 'url')}
                        >
                          <Text style={styles.watchedBtnText}>✓ Mark as Watched</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Uploaded Videos */}
              {uploadedVideos.map((video, index) => {
                const watched = isVideoWatched(video.fileUrl, 'uploaded');
                
                return (
                  <View key={`uploaded-${index}`} style={styles.videoCard}>
                    <View style={styles.videoHeader}>
                      <View style={styles.videoTitleRow}>
                        <Text style={styles.videoIndex}>
                          {videoUrls.length + index + 1}
                        </Text>
                        <Text style={styles.videoTitle}>
                          {video.fileName || `Video ${videoUrls.length + index + 1}`}
                        </Text>
                      </View>
                      {watched && (
                        <View style={styles.watchedBadge}>
                          <Text style={styles.watchedText}>✓ Watched</Text>
                        </View>
                      )}
                    </View>

                    {/* Video Player */}
                    {video.fileUrl && (
                      <View style={styles.videoPlayer}>
                        <Video
                          source={{ uri: video.fileUrl }}
                          style={styles.video}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          onPlaybackStatusUpdate={(status) => {
                            // Auto-mark as watched when video ends
                            if (status.didJustFinish && !watched) {
                              handleMarkVideoWatched(video.fileUrl, 'uploaded');
                            }
                          }}
                        />
                      </View>
                    )}

                    {!watched && (
                      <TouchableOpacity 
                        style={styles.watchedBtn}
                        onPress={() => handleMarkVideoWatched(video.fileUrl, 'uploaded')}
                      >
                        <Text style={styles.watchedBtnText}>✓ Mark as Watched</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Close Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  teacher: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#6b7280',
  },
  progressSection: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  completedBadge: {
    marginTop: 10,
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completedText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  descriptionSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  zoomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  zoomIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  zoomInfo: {
    flex: 1,
  },
  zoomTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e40af',
  },
  zoomLink: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 2,
  },
  zoomArrow: {
    fontSize: 18,
    color: '#2563eb',
  },
  videosSection: {
    marginBottom: 20,
  },
  noVideos: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  noVideosIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  noVideosText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  noVideosSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  videoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
    overflow: 'hidden',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  watchedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  watchedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  externalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  externalBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  watchedBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  watchedBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
