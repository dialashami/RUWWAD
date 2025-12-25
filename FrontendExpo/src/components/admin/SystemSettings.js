import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { systemSettingsAPI } from '../../services/api';

const timezones = [
  { label: 'Palestine/Jerusalem (GMT+2)', value: 'Asia/Jerusalem' },
  { label: 'Riyadh (GMT+3)', value: 'Asia/Riyadh' },
  { label: 'Dubai (GMT+4)', value: 'Asia/Dubai' },
  { label: 'Cairo (GMT+2)', value: 'Africa/Cairo' },
  { label: 'London (GMT+0)', value: 'Europe/London' },
  { label: 'New York (GMT-5)', value: 'America/New_York' },
];

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Arabic', value: 'ar' },
];

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'Ruwwad Educational Platform',
    platformVersion: 'v1.0.0',
    defaultLanguage: 'en',
    timezone: 'Asia/Jerusalem',
    adminEmail: 'admin@ruwwad.edu',
    supportEmail: 'support@ruwwad.edu',
  });
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await systemSettingsAPI.getSettings();
      if (response.data) {
        setSettings({
          platformName: response.data.platformName || 'Ruwwad Educational Platform',
          platformVersion: response.data.platformVersion || 'v1.0.0',
          defaultLanguage: response.data.defaultLanguage || 'en',
          timezone: response.data.timezone || 'Asia/Jerusalem',
          adminEmail: response.data.adminEmail || 'admin@ruwwad.edu',
          supportEmail: response.data.supportEmail || 'support@ruwwad.edu',
        });
      }
    } catch (err) {
      console.log('Using default settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await systemSettingsAPI.updateSettings(settings);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getLanguageLabel = () => {
    const lang = languages.find(l => l.value === settings.defaultLanguage);
    return lang ? lang.label : 'English';
  };

  const getTimezoneLabel = () => {
    const tz = timezones.find(t => t.value === settings.timezone);
    return tz ? tz.label : settings.timezone;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Settings</Text>
        <Text style={styles.headerSubtitle}>Configure platform settings</Text>
      </View>

      {/* General Settings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🌐</Text>
          <Text style={styles.cardTitle}>General Settings</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Platform Name</Text>
          <TextInput
            style={styles.input}
            value={settings.platformName}
            onChangeText={(text) => handleChange('platformName', text)}
            placeholder="Enter platform name"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Platform Version</Text>
          <TextInput
            style={styles.input}
            value={settings.platformVersion}
            onChangeText={(text) => handleChange('platformVersion', text)}
            placeholder="e.g., v1.0.0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Default Language</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <Text style={styles.pickerButtonText}>{getLanguageLabel()}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          {showLanguagePicker && (
            <View style={styles.pickerOptions}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[
                    styles.pickerOption,
                    settings.defaultLanguage === lang.value && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    handleChange('defaultLanguage', lang.value);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      settings.defaultLanguage === lang.value && styles.pickerOptionTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Timezone</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTimezonePicker(!showTimezonePicker)}
          >
            <Text style={styles.pickerButtonText}>{getTimezoneLabel()}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          {showTimezonePicker && (
            <View style={styles.pickerOptions}>
              {timezones.map((tz) => (
                <TouchableOpacity
                  key={tz.value}
                  style={[
                    styles.pickerOption,
                    settings.timezone === tz.value && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    handleChange('timezone', tz.value);
                    setShowTimezonePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      settings.timezone === tz.value && styles.pickerOptionTextActive,
                    ]}
                  >
                    {tz.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Email Settings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📧</Text>
          <Text style={styles.cardTitle}>Email Settings</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Admin Email</Text>
          <TextInput
            style={styles.input}
            value={settings.adminEmail}
            onChangeText={(text) => handleChange('adminEmail', text)}
            placeholder="admin@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Support Email</Text>
          <TextInput
            style={styles.input}
            value={settings.supportEmail}
            onChangeText={(text) => handleChange('supportEmail', text)}
            placeholder="support@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>💾 Save Settings</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  pickerOptions: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionActive: {
    backgroundColor: '#eff6ff',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    marginHorizontal: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
