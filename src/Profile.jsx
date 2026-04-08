import React, { useContext, useEffect, useState } from 'react';
// CHANGE: Removed Alert import
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Modal, TextInput, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ThemeContext } from './context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [userName, setUserName] = useState('Guest User');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // CHANGE: Added state for custom info Modal
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  // CHANGE: Function to trigger custom modal instead of native alert
  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const fetchUser = async () => {
    try {
      const savedProfileJson = await AsyncStorage.getItem('localbites_profile');
      if (savedProfileJson) {
        const profileData = JSON.parse(savedProfileJson);
        if (profileData.userName) {
          setUserName(profileData.userName);
          setNewName(profileData.userName);
        }
      }
    } catch (err) {
      console.log("Failed to load local profile:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      // CHANGE: Using custom modal
      return showAlert("Error", "Name cannot be empty");
    }
    
    setIsUpdating(true);
    
    try {
      let existingProfile = {};
      const savedProfileJson = await AsyncStorage.getItem('localbites_profile');
      if (savedProfileJson) {
        existingProfile = JSON.parse(savedProfileJson);
      }
      
      existingProfile.userName = newName;
      await AsyncStorage.setItem('localbites_profile', JSON.stringify(existingProfile));
      
      setUserName(newName);
      setEditModalVisible(false);
    } catch (err) {
      // CHANGE: Using custom modal
      showAlert("Error", "Failed to update name locally.");
    } finally {
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { id: 1, title: 'Manage Address', icon: 'map-pin', type: 'feather', action: () => navigation.navigate('ManageAddress') },
    // CHANGE: Swapped Alert.alert for custom showAlert modal
    { id: 2, title: 'Favorites', icon: 'heart', type: 'feather', action: () => showAlert("Coming Soon", "We are working hard to bring you Favorites soon!") },
    { id: 3, title: 'Recent Orders', icon: 'clipboard-text-outline', type: 'material', action: () => navigation.navigate('History') },
    // CHANGE: Swapped Alert.alert for custom showAlert modal
    { id: 4, title: 'Settings', icon: 'settings', type: 'feather', action: () => showAlert("Coming Soon", "App Settings will be available in the next update!") },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* CHANGE: Added Custom Alert Modal UI for Info/Errors */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, alignItems: 'center' }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
                <Text style={[styles.modalMessage, { color: theme.subText, textAlign: 'center', marginBottom: 20 }]}>{alertConfig.message}</Text>
                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: theme.accent, width: '50%', alignItems: 'center' }]} 
                  onPress={() => setAlertVisible(false)}
                >
                    <Text style={{ color: '#FFF', fontFamily: 'montserrat_bold' }}>OK</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Name</Text>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
              value={newName} 
              onChangeText={setNewName}
              placeholder="Enter your name"
              placeholderTextColor={theme.subText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: theme.subText, fontFamily: 'montserrat_medium' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleUpdateName}>
                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontFamily: 'montserrat_bold' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><AntDesign name="arrowleft" size={28} color={theme.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeaderSection}>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <Text style={[styles.completionText, { color: theme.accent }]}>LocalBites User</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Feather name="edit-2" size={14} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={[styles.editButtonText, { color: theme.text }]}>EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuContainer, { backgroundColor: theme.card }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.menuItem, index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]} onPress={item.action}>
              <View style={styles.menuIconContainer}>
                {item.type === 'feather' ? <Feather name={item.icon} size={22} color={theme.accent} /> : <MaterialCommunityIcons name={item.icon} size={24} color={theme.accent} />}
              </View>
              <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
              <Feather name="chevron-right" size={20} color={theme.text} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileHeaderSection: { alignItems: 'center', marginBottom: 35, marginTop: 30 },
  userName: { fontFamily: 'montserrat_bold', fontSize: 28, marginBottom: 5 },
  completionText: { fontFamily: 'montserrat_medium', fontSize: 14, marginBottom: 15 },
  editButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  editButtonText: { fontFamily: 'montserrat_bold', fontSize: 12, letterSpacing: 1 },
  menuContainer: { borderRadius: 16, paddingHorizontal: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  menuIconContainer: { width: 30, alignItems: 'flex-start' },
  menuTitle: { flex: 1, fontFamily: 'montserrat_medium', fontSize: 16, marginLeft: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 25 },
  modalTitle: { fontFamily: 'montserrat_bold', fontSize: 18, marginBottom: 15 },
  modalMessage: { fontFamily: 'montserrat_regular', fontSize: 14, lineHeight: 22 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20, fontFamily: 'montserrat_regular' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 12, marginRight: 10, justifyContent: 'center' },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, justifyContent: 'center' }
});

export default Profile;