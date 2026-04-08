import React, { useState, useRef, useContext } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, Image, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from './context/ThemeContext';

const { width, height } = Dimensions.get('window');

// CHANGE: Added the "Welcome" slide as the first item in the array.
// Added a "type" property to differentiate between our custom Welcome slide and your Image slides.
const slides = [
  {
    id: '0',
    type: 'welcome',
    title: 'Welcome to LocalBites',
    description: 'The best local restaurants and street food, brought directly to your doorstep.',
    icon: 'storefront-outline'
  },
  {
    id: '1',
    type: 'image',
    image: require('./assets/onboarding/1.png'), 
  },
  {
    id: '2',
    type: 'image',
    image: require('./assets/onboarding/2.png'),
  },
  {
    id: '3',
    type: 'image',
    image: require('./assets/onboarding/3.png'),
  }
];

const Onboarding = ({ navigation }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding_v1', 'true');
      navigation.replace('Home'); 
    } catch (err) { 
      navigation.replace('Home'); 
    }
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      // CHANGE: Ensure this triggers on the final "START" screen
      finishOnboarding();
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      flatListRef.current.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const renderSlide = ({ item }) => {
    // CHANGE: Logic to render the new React Native "Welcome" screen
    if (item.type === 'welcome') {
      return (
        <View style={[styles.slide, { width, backgroundColor: theme.bg }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
            <MaterialCommunityIcons name={item.icon} size={100} color={theme.accent} />
          </View>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.welcomeDesc, { color: theme.subText }]}>{item.description}</Text>
          
          <View style={styles.welcomeFooter}>
            <TouchableOpacity style={[styles.welcomeBtn, { backgroundColor: theme.accent }]} onPress={nextSlide}>
              <Text style={styles.welcomeBtnText}>LET'S GO</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // CHANGE: Logic to render your Figma Images with FOOLPROOF massive touch zones
    return (
      <View style={[styles.slide, { width }]}>
        {/* resizeMode contain ensures nothing gets cropped on different screen sizes */}
        <Image 
          source={item.image} 
          style={styles.fullScreenImage} 
          resizeMode="contain" 
        />
        
        {/* CHANGE: These touch zones cover the bottom 20% of the screen. 
            They are massive so the user physically cannot miss the tap target. */}
        <View style={styles.massiveTouchZones}>
          <TouchableOpacity 
            style={styles.touchLeft} 
            onPress={item.id === '2' ? finishOnboarding : prevSlide} // Assuming ID '2' (second Figma image) has the SKIP button
          />
          <TouchableOpacity 
            style={styles.touchRight} 
            onPress={nextSlide} 
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F7F7F7' }]}>
      <StatusBar hidden={true} />
      
      <FlatList
        ref={flatListRef}
        data={slides}
        onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        bounces={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  slide: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  // --- Welcome Screen Styles ---
  iconContainer: { width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  welcomeTitle: { fontFamily: 'montserrat_bold', fontSize: 28, marginBottom: 15, textAlign: 'center', paddingHorizontal: 20 },
  welcomeDesc: { fontFamily: 'montserrat_medium', fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 40 },
  welcomeFooter: { position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 30 },
  welcomeBtn: { flexDirection: 'row', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  welcomeBtnText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#FFF', letterSpacing: 1 },

  // --- Image Screen Styles ---
  fullScreenImage: { 
    width: '100%', 
    height: '100%' 
  },
  
  // CHANGE: The new Massive Touch Zones
  massiveTouchZones: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%', // Covers the entire bottom 20% of the phone screen
    flexDirection: 'row'
  },
  touchLeft: {
    flex: 1,
    backgroundColor: 'transparent', // Change to 'rgba(255,0,0,0.3)' to visually test the touch area
  },
  touchRight: {
    flex: 1,
    backgroundColor: 'transparent', // Change to 'rgba(0,255,0,0.3)' to visually test the touch area
  }
});

export default Onboarding;