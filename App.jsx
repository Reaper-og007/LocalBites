import { enableScreens } from 'react-native-screens';
enableScreens(false);
import 'react-native-url-polyfill/auto'; 
import DeviceInfo from 'react-native-device-info'; 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/lib/supabase';
import { ThemeProvider } from './src/context/ThemeContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Messaging Import
import messaging from '@react-native-firebase/messaging';

// Screens
import Profile from './src/Profile';
import Welcome from './src/Welcome';
import Home from './src/Home';
import History from './src/History';
import Search from './src/Search';
import Details from './src/Details';
import Checkout from './src/Checkout'; 
import Contact from './src/Contact';
import ManageAddress from './src/ManageAddress';
import Onboarding from './src/Onboarding';

const Stack = createNativeStackNavigator();
const CURRENT_VERSION_CODE = parseInt(DeviceInfo.getBuildNumber() || '1'); 

// 1. Background message handler - must be outside the App component
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background Notification Received:', remoteMessage);
});

const App = () => {
  const [loading, setLoading] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  
  // Maintenance mode state
  const [maintenanceConfig, setMaintenanceConfig] = useState({ isActive: false, message: '' });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 2. FETCH: Mandatory Updates & Maintenance Status from Supabase
        const { data, error } = await supabase
          .from('app_config')
          .select('min_version, is_maintenance, maintenance_message')
          .single();

        if (!error && data) {
          if (parseInt(data.min_version) > CURRENT_VERSION_CODE) {
            setNeedsUpdate(true);
          }
          if (data.is_maintenance) {
            setMaintenanceConfig({ isActive: true, message: data.maintenance_message });
          }
        }

        // 3. CHECK: Onboarding status
        const hasSeen = await AsyncStorage.getItem('has_seen_onboarding_v1');
        setIsFirstLaunch(hasSeen !== 'true');

        // 4. SETUP: Firebase Cloud Messaging Permissions & Tokens
        await setupFirebaseMessaging();

      } catch (err) {
        console.log("App Init Error (Safe Bypass):", err);
        setIsFirstLaunch(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    // 5. LISTEN: Handle notifications while the app is in the FOREGROUND
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      // This is what you see in image_208fde.jpg
      Alert.alert(
        remoteMessage.notification?.title || 'Notification', 
        remoteMessage.notification?.body
      );
    });

    return unsubscribe;
  }, []);

  // CHANGE: Robust FCM Setup with explicit Permission Check
  const setupFirebaseMessaging = async () => {
    try {
      // Request explicit permission (Required for Android 13+)
      const authStatus = await messaging().requestPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Push Notifications Enabled. Status:', authStatus);
        
        // Subscribe to global topic for marketing blasts
        await messaging().subscribeToTopic('localbites_promos');
        
        // Grab unique device token for order confirmations
        const token = await messaging().getToken();
        if (token) {
          // Store token to use in Contact.jsx order payload
          await AsyncStorage.setItem('fcm_token', token);
          console.log("Device Token Stored Successfully");
        }
      } else {
        console.log('User denied notification permissions');
      }
    } catch (error) {
      console.log("FCM Logic Error:", error);
    }
  };

  if (loading || isFirstLaunch === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // 6. UI: Maintenance Screen Shield
  if (maintenanceConfig.isActive) {
    return (
      <View style={styles.updateContainer}>
        <View style={styles.contentCard}>
          <Text style={styles.emoji}>🛠️</Text>
          <Text style={styles.title}>Under Maintenance</Text>
          <Text style={styles.message}>
            {maintenanceConfig.message || "We are currently upgrading our systems. Be right back!"}
          </Text>
        </View>
      </View>
    );
  }

  // 7. UI: Force Update Screen
  if (needsUpdate) {
    return (
      <View style={styles.updateContainer}>
        <View style={styles.contentCard}>
          <Text style={styles.emoji}>📦</Text>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            A newer version of LocalBites is available. Please update to continue ordering.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.localbitesnew')}
          >
            <Text style={styles.buttonText}>UPDATE NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={isFirstLaunch ? "Onboarding" : "Welcome"} 
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Onboarding" component={Onboarding} />
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="History" component={History} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="ManageAddress" component={ManageAddress} />
          <Stack.Screen name="Search" component={Search} />
          <Stack.Screen name="Details" component={Details} />
          <Stack.Screen name="Checkout" component={Checkout} /> 
          <Stack.Screen name="Contact" component={Contact} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  updateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8', padding: 20 },
  contentCard: { backgroundColor: '#fff', padding: 30, borderRadius: 25, alignItems: 'center', width: '100%', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 },
  emoji: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 15, textAlign: 'center' },
  message: { textAlign: 'center', fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 40 },
  button: { backgroundColor: '#000', paddingVertical: 18, width: '100%', borderRadius: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

export default App;