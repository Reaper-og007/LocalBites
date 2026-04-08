import { enableScreens } from 'react-native-screens';

enableScreens(false);
import 'react-native-url-polyfill/auto'; 
import DeviceInfo from 'react-native-device-info'; 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/lib/supabase';
import { ThemeProvider } from './src/context/ThemeContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

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
// CHANGE: Imported the new Onboarding screen
import Onboarding from './src/Onboarding';

const Stack = createNativeStackNavigator();

const CURRENT_VERSION_CODE = parseInt(DeviceInfo.getBuildNumber() || '1'); 

const App = () => {
  const [loading, setLoading] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  // CHANGE: Initialized as null to prevent premature rendering
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Check for Mandatory Updates
        const { data, error } = await supabase
          .from('app_config')
          .select('min_version')
          .single();

        if (!error && data && parseInt(data.min_version) > CURRENT_VERSION_CODE) {
          setNeedsUpdate(true);
        }

        // 2. CHANGE: Check Onboarding status inside the same initialization flow
        const hasSeen = await AsyncStorage.getItem('has_seen_onboarding_v1');
        setIsFirstLaunch(hasSeen !== 'true');

      } catch (err) {
        console.log("Initialization failed (safe bypass):", err);
        // Fallback: If everything fails, assume they've seen onboarding to be safe
        setIsFirstLaunch(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // CHANGE: Added check for isFirstLaunch to ensure we don't render until state is ready
  if (loading || isFirstLaunch === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (needsUpdate) {
    return (
      <View style={styles.updateContainer}>
        <View style={styles.contentCard}>
          <Text style={styles.emoji}>📦</Text>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            A newer, faster version of LocalBites is ready for you. Please update to continue ordering.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.localbites')}
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
        {/* CHANGE: initialRouteName now dynamically chooses between Onboarding (new users) and Welcome (returning users) */}
        <Stack.Navigator 
          initialRouteName={isFirstLaunch ? "Onboarding" : "Welcome"} 
          screenOptions={{ headerShown: false }}
        >
          {/* CHANGE: Added Onboarding to the stack */}
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