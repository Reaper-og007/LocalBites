import { enableScreens } from 'react-native-screens';

enableScreens(false);
import 'react-native-url-polyfill/auto'; // ADDED: Supabase needs this to not crash
import DeviceInfo from 'react-native-device-info'; // ADDED: Actually using it now
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './src/context/ThemeContext'; // Adjust path as needed

// Screens
import Welcome from './src/Welcome';
import Home from './src/Home';
import Search from './src/Search';
import Details from './src/Details';
import Checkout from './src/Checkout'; 
import Contact from './src/Contact';

const Stack = createNativeStackNavigator();

// --- CONFIGURATION ---
// Boss move: It now automatically reads your versionCode from build.gradle
const CURRENT_VERSION_CODE = parseInt(DeviceInfo.getBuildNumber() || '1'); 

const App = () => {
  const [loading, setLoading] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // Fetch min_version from Supabase
        const { data, error } = await supabase
          .from('app_config')
          .select('min_version')
          .single();

        if (error) throw error; // If DB is down or row is missing, jump to catch

        if (data && parseInt(data.min_version) > CURRENT_VERSION_CODE) {
          setNeedsUpdate(true);
        }
      } catch (err) {
        // If internet fails or DB fails, we let them in to prevent a crash.
        // The business keeps running even if the check fails.
        console.log("Update check failed (safe bypass):", err);
      } finally {
        setLoading(false);
      }
    };

    checkUpdate();
  }, []);

  // 1. Initial Load (Black spinner)
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // 2. The Mandatory Gatekeeper (Permanent Overlay)
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

  // 3. Main Navigation
  return (
    <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Home" component={Home} />
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
  updateContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8f8f8', 
    padding: 20 
  },
  contentCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  emoji: { fontSize: 60, marginBottom: 20 },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#000', 
    marginBottom: 15,
    textAlign: 'center' 
  },
  message: { 
    textAlign: 'center', 
    fontSize: 16, 
    color: '#666', 
    lineHeight: 24, 
    marginBottom: 40 
  },
  button: { 
    backgroundColor: '#000', 
    paddingVertical: 18, 
    width: '100%', 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

export default App;
