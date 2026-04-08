import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Modal } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { ThemeContext } from './context/ThemeContext';

const History = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  
  // CHANGE: Set loading to false and use a static empty state with a "Coming Soon" vibe
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Recent Orders</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.centerContainer}>
        {/* Visual for Coming Soon */}
        <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
          <Feather name="clock" size={50} color={theme.accent} />
        </View>
        
        <Text style={[styles.comingSoonTitle, { color: theme.text }]}>Coming Soon!</Text>
        
        <Text style={[styles.description, { color: theme.subText }]}>
          We are upgrading our systems to provide you with a detailed order tracking experience.
        </Text>

        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.accent }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>

      {/* Subtle branding at the bottom */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.border }]}>LocalBites v1.0.6</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  
  comingSoonTitle: { fontFamily: 'montserrat_bold', fontSize: 24, marginBottom: 10 },
  description: { fontFamily: 'montserrat_medium', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  
  backBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15, elevation: 3 },
  backBtnText: { fontFamily: 'montserrat_bold', color: '#FFF', fontSize: 16, letterSpacing: 1 },
  
  footer: { paddingBottom: 20, alignItems: 'center' },
  footerText: { fontFamily: 'montserrat_bold', fontSize: 12, letterSpacing: 2 }
});

export default History;