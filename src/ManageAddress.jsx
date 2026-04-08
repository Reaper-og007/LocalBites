import React, { useState, useEffect, useContext } from 'react';
// CHANGE: Removed Alert import, added Modal
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Modal } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ThemeContext } from './context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ManageAddress = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [loading, setLoading] = useState(false);

  // CHANGE: Added state for custom Modal
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: null });

  // CHANGE: Custom function to trigger our themed modal instead of native Alert
  const showAlert = (title, message, onConfirm = null) => {
    setAlertConfig({ title, message, onConfirm });
    setAlertVisible(true);
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('localbites_profile');
      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        if (data.userPhone) setPhone(data.userPhone);
        if (data.userAddress) setAddress(data.userAddress);
        if (data.userLandmark) setLandmark(data.userLandmark);
      }
    } catch (err) {
      console.log("Error loading address:", err);
    }
  };

  const handleSave = async () => {
    if (!phone || !address) {
      // CHANGE: Using custom modal
      return showAlert("Error", "Phone and Address are required.");
    }

    if (phone.length !== 10) {
      // CHANGE: Using custom modal
      return showAlert("Invalid Phone", "Please enter a valid 10-digit number.");
    }

    setLoading(true);

    try {
      const existingProfileJson = await AsyncStorage.getItem('localbites_profile');
      let currentProfile = existingProfileJson ? JSON.parse(existingProfileJson) : {};

      const updatedProfile = {
        ...currentProfile,
        userPhone: phone,
        userAddress: address,
        userLandmark: landmark,
      };

      await AsyncStorage.setItem('localbites_profile', JSON.stringify(updatedProfile));
      
      setLoading(false);
      // CHANGE: Using custom modal and passing the navigation goBack function as the confirm action
      showAlert("Success 🎉", "Default delivery details updated!", () => navigation.goBack());
    } catch (err) {
      setLoading(false);
      // CHANGE: Using custom modal
      showAlert("Error", "Failed to save details locally.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* CHANGE: Added the Custom Alert Modal UI */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
                <Text style={[styles.modalMessage, { color: theme.subText }]}>{alertConfig.message}</Text>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: theme.accent }]} 
                  onPress={() => {
                    setAlertVisible(false);
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                  }}
                >
                    <Text style={[styles.modalButtonText, { color: '#FFF' }]}>OK</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Address</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.subText, { color: theme.subText }]}>
          Set your default delivery details here. This will automatically fill out your checkout form on your next order.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="e.g. 8390838652"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Default Address</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="House No, Street Name..."
            placeholderTextColor={theme.subText}
            multiline
            numberOfLines={4}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Landmark</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="e.g. Near Water Tank"
            placeholderTextColor={theme.subText}
            value={landmark}
            onChangeText={setLandmark}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.accent }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE DETAILS</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 30 },
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 22 },
  backButton: { padding: 5 },
  content: { paddingHorizontal: 25 },
  subText: { fontFamily: 'montserrat_medium', fontSize: 14, lineHeight: 22, marginBottom: 30 },
  inputGroup: { marginBottom: 25 },
  label: { fontFamily: 'montserrat_bold', fontSize: 14, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, height: 55, fontFamily: 'montserrat_regular', fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: 15 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  saveButton: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  saveButtonText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#FFF', letterSpacing: 1 },
  
  // CHANGE: Styles for the new Custom Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, 
  modalContainer: { width: '80%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 }, 
  modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 10, textAlign: 'center' }, 
  modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 25, textAlign: 'center', lineHeight: 22 }, 
  modalButton: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontFamily: 'montserrat_bold', fontSize: 16 }
});

export default ManageAddress;