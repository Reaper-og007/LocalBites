import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Alert, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from './context/ThemeContext';
import { supabase } from './lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import GoogleIcon from './components/GoogleIcon'; 

GoogleSignin.configure({
  webClientId: '985273293440-6c924tat021bvevp7uu6ai4qkpof1esl.apps.googleusercontent.com', 
});

const Login = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  
  // Form State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Navigation Helper
  const goToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  // --- 4. REMEMBER USER: Check for existing session on load ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        goToHome(); // Automatically skip login if they are remembered
      }
    };
    checkSession();
  }, []);

  // --- ENGINE 1: Google Login ---
  const handleGoogleLogin = async () => {
    // 1. MUST AGREE TO TERMS
    if (!agreedToTerms) {
      return Alert.alert("Terms Required", "Please agree to the User Agreement.");
    }

    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        if (error) throw error;
        goToHome();
      }
    } catch (error) {
      Alert.alert("Google Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ENGINE 2: Email & Password ---
  const handleEmailAction = async () => {
    if (!email || !password) {
      return Alert.alert("Missing Info", "Please enter both email and password.");
    }
    // 1. MUST AGREE TO TERMS
    if (!agreedToTerms) {
      return Alert.alert("Terms Required", "Please agree to the User Agreement.");
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        // Sign In Logic
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        goToHome();
      } else {
        // Sign Up Logic
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        
        // 3. REMOVED CONFIRMATION POPUP. Direct to home.
        goToHome();
      }
    } catch (error) {
      Alert.alert("Auth Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.accent }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.headerArea}>
          <Image 
            source={require('./assets/img/localbitespng.png')} 
            style={styles.logoImage}
            resizeMode="contain" 
          />
        </View>

        <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <TextInput 
                  style={[styles.inputField, { color: theme.text }]} 
                  placeholder="Enter your email" 
                  placeholderTextColor={theme.subText} 
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <TextInput 
                  style={[styles.inputField, { color: theme.text }]} 
                  secureTextEntry={!isPasswordVisible} 
                  placeholder="Enter password"
                  placeholderTextColor={theme.subText}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Feather name={isPasswordVisible ? "eye" : "eye-off"} size={20} color={theme.subText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password (Sign Up Only) */}
            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm Password</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                  <TextInput 
                    style={[styles.inputField, { color: theme.text }]} 
                    secureTextEntry 
                    placeholder="Repeat password"
                    placeholderTextColor={theme.subText}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>
            )}

            {/* Terms Checkbox */}
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: agreedToTerms ? theme.accent : 'transparent' }]}>
                {agreedToTerms && <Feather name="check" size={14} color="#FFF" />}
              </View>
              <Text style={[styles.agreementText, { color: theme.subText }]}>
                I've read and agreed to <Text style={{ color: theme.accent, fontWeight: 'bold' }}>User Agreement</Text>
              </Text>
            </TouchableOpacity>

            {/* Main Action Button */}
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.accent }]} onPress={handleEmailAction} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.mainButtonText}>{isLoginMode ? 'Sign in' : 'Sign Up'}</Text>}
            </TouchableOpacity>

            <View style={styles.separatorRow}>
              <Text style={[styles.separatorText, { color: theme.subText }]}>or connect with</Text>
            </View>

            {/* Social Row */}
            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={[styles.socialButton, { borderColor: theme.border }]} 
                onPress={handleGoogleLogin}
              >
                <GoogleIcon size={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.footerRow} onPress={() => setIsLoginMode(!isLoginMode)}>
              <Text style={[styles.footerText, { color: theme.subText }]}>
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{isLoginMode ? 'Sign Up' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>

            {/* --- 2. NOT MANDATORY: Browse as Guest Option --- */}
            <TouchableOpacity style={styles.guestRow} onPress={goToHome}>
              <Text style={[styles.guestText, { color: theme.subText }]}>Continue as Guest</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { 
    height: 200, // Fixed height to stop keyboard vibration
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: 20 
  },
  logoImage: {
    width: '70%', 
    height: 190,  
  },
  logoText: { fontFamily: 'montserrat_bold', fontSize: 48, color: '#FFF' },
  bottomSheet: { flex: 1, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 25, paddingTop: 30 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontFamily: 'montserrat_bold', fontSize: 13, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 15, height: 55, paddingHorizontal: 15 },
  inputField: { flex: 1, fontFamily: 'montserrat_regular' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  agreementText: { fontSize: 12 },
  mainButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mainButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  separatorRow: { alignItems: 'center', marginVertical: 20 },
  separatorText: { fontSize: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  socialButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  footerRow: { alignItems: 'center', paddingBottom: 10 },
  footerText: { fontSize: 13 },
  guestRow: { alignItems: 'center', paddingBottom: 30 },
  guestText: { fontSize: 14, fontFamily: 'montserrat_medium', textDecorationLine: 'underline' }
});

export default Login;