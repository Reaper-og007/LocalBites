import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, ActivityIndicator, Alert, Linking } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';

const { width } = Dimensions.get('window');
const CURRENT_VERSION_CODE = 6;

const Home = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [restaurants, setRestaurants] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    checkUpdate(); 
    fetchRestaurants(); 
    fetchPopularItems();
  }, []);

  const checkUpdate = async () => {
    try {
      const { data, error } = await supabase.from('app_metadata').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (data && data.min_version_code > CURRENT_VERSION_CODE) {
        Alert.alert(
          "Update Required", "A new update is available. Please update to the latest version to continue using LocalBites!",
          [{ text: "Update Now", onPress: () => Linking.openURL(data.url || 'https://play.google.com/store/apps/details?id=com.localbitesnew') }],
          { cancelable: false }
        );
      }
    } catch (err) { console.log("Update check failed", err); }
  };

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false });
      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) { console.error("Restaurants Error:", error.message); } 
  };

  const fetchPopularItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, restaurants(*)') 
        .eq('is_popular', true)
        .order('popular_order', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      setPopularItems(data || []);
    } catch (error) { 
      console.log("Popular Items Error (You may need to adjust the table name):", error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const checkIsRestaurantOpen = (rest) => {
    if (!rest) return false;
    if (rest.is_open === false) return false; 
    if (!rest.open_time || !rest.close_time) return true;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = rest.open_time.split(':').map(Number);
    const [closeH, closeM] = rest.close_time.split(':').map(Number);

    const openMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;

    if (closeMins < openMins) { 
      return currentMins >= openMins || currentMins <= closeMins;
    }
    return currentMins >= openMins && currentMins <= closeMins;
  };

  const topRestaurant = restaurants.find(r => r.is_featured === true) || restaurants[0]; 
  const remainingRestaurants = restaurants.filter(r => r.id !== topRestaurant?.id); 
  
  const categories = [
    { name: 'Burgers', icon: 'hamburger' }, 
    { name: 'Pizza', icon: 'pizza' }, 
    { name: 'Fast Food', icon: 'french-fries' }, 
    { name: 'North Indian', icon: 'food-variant' }, 
    { name: 'Drinks', icon: 'cup-water' }
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <View style={[styles.skeletonBlock, { width: 180, height: 35, backgroundColor: theme.border }]} />
          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            <View style={[styles.skeletonBlock, { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.border }]} />
            <View style={[styles.skeletonBlock, { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.border }]} />
          </View>
        </View>

        <View style={[styles.skeletonBlock, styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]} />

        <View style={[styles.skeletonBlock, { width: 200, height: 20, marginHorizontal: 20, marginBottom: 15, marginTop: 10, backgroundColor: theme.border }]} />
        <View style={[styles.skeletonBlock, styles.heroCard, { height: 180, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} />

        <View style={[styles.skeletonBlock, { width: 180, height: 20, marginHorizontal: 20, marginBottom: 15, marginTop: 10, backgroundColor: theme.border }]} />
        <View style={{ flexDirection: 'row', paddingLeft: 20, marginBottom: 30 }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ alignItems: 'center', marginRight: 25 }}>
              <View style={[styles.skeletonBlock, styles.categoryCircle, { backgroundColor: theme.card, borderColor: theme.border }]} />
              <View style={[styles.skeletonBlock, { width: 50, height: 10, marginTop: 5, backgroundColor: theme.border }]} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>WELCOME</Text>
          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
              <Feather name={isDarkMode ? "sun" : "moon"} size={24} color={theme.text} />
            </TouchableOpacity>
            {/* CHANGE: Removed handleProfileClick auth check. Navigates straight to Profile screen. */}
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconButton}>
              <Feather name="user" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.7} onPress={() => navigation.navigate('Search')}>
          <AntDesign name="search1" size={20} color={theme.subText} style={styles.searchIcon} />
          <TextInput placeholder="Search for food or restaurants" placeholderTextColor={theme.subText} style={[styles.searchInput, { color: theme.text }]} editable={false} pointerEvents="none" />
        </TouchableOpacity>

        {/* --- SECTION 1: TOP RESTAURANT --- */}
        {topRestaurant && (() => {
          const isTopOpen = checkIsRestaurantOpen(topRestaurant);
          return (
            <View style={styles.heroSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Top restaurant this week</Text>
              </View>
              
              <TouchableOpacity style={[styles.heroCard, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Details', { restaurant: topRestaurant })}>
                <View style={styles.heroImageContainer}>
                  <Image source={{ uri: topRestaurant.image_url }} style={styles.heroImage} />
                  {!isTopOpen && <View style={styles.closedOverlay}><Text style={styles.closedText}>CLOSED</Text></View>}
                  
                  <View style={[styles.badgeContainer, { backgroundColor: theme.accent }]}>
                    <Text style={styles.badgeText}>Explore</Text>
                  </View>
                </View>
                
                <View style={styles.heroContent}>
                  <Text style={[styles.heroTitle, { color: theme.text }]}>{topRestaurant.name}</Text>
                  <Text style={[styles.heroSubtitle, { color: theme.subText }]} numberOfLines={1}>{topRestaurant.location}</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* --- SECTION 2: CATEGORIES --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Shop By Categories</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20 }}>
          {categories.map((item, index) => (
            <TouchableOpacity key={index} style={styles.categoryItem} onPress={() => navigation.navigate('Search', { categoryQuery: item.name })}>
              <View style={[styles.categoryCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <MaterialCommunityIcons name={item.icon} size={28} color={theme.accent} />
              </View>
              <Text style={[styles.categoryText, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- SECTION 3: MORE LOCAL BRANDS --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>More Restaurants</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20 }}>
          {remainingRestaurants.map((rest) => {
            const isRestOpen = checkIsRestaurantOpen(rest);
            const dietColor = rest.is_veg ? '#0f8a46' : '#e23744'; 

            return (
              <TouchableOpacity key={rest.id} style={[styles.modernCard, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Details', { restaurant: rest })}>
                <View style={styles.modernCardImageContainer}>
                  <Image source={{ uri: rest.image_url }} style={styles.modernCardImage} />
                  {!isRestOpen && <View style={styles.closedOverlaySmall}><Text style={styles.closedTextSmall}>CLOSED</Text></View>}
                </View>
                
                <View style={styles.modernCardContent}>
                  <Text style={[styles.modernCardTitle, { color: theme.text }]} numberOfLines={2}>
                    {rest.name}
                  </Text>
                  
                  <View style={styles.subtitleRow}>
                    <View style={[styles.vegIconBorder, { borderColor: dietColor }]}>
                      <View style={[styles.vegIconDot, { backgroundColor: dietColor, borderRadius: rest.is_veg ? 4 : 50 }]} />
                    </View>
                    <Text style={[styles.modernCardSubtitle, { color: theme.subText }]} numberOfLines={1}>
                      {'  '}•{'  '}{rest.location || 'Local'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- SECTION 4: MOST POPULAR ITEMS --- */}
        {popularItems.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Most Popular Items</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20 }}>
              {popularItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.popularCard, { backgroundColor: theme.card }]} 
                  onPress={() => navigation.navigate('Details', { restaurant: item.restaurants, autoSelectItem: item })}
                >
                  <View style={styles.popularImageContainer}>
                    <Image source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} style={styles.popularImage} />
                    <View style={[styles.addButton, { backgroundColor: theme.accent }]}>
                      <AntDesign name="plus" size={14} color="#FFF" />
                    </View>
                  </View>
                  
                  <View style={styles.popularContent}>
                    <View>
                      <Text style={[styles.popularTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                      <Text style={[styles.popularPrice, { color: theme.text }]}>₹{Math.round(item.price * 1.2)}</Text>
                    </View>
                    <Text style={[styles.popularRestaurant, { color: theme.subText }]} numberOfLines={2}>
                      {item.restaurants?.name || 'Local Restaurant'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  scrollContent: { paddingBottom: 40 },
  
  header: { paddingHorizontal: 20, marginTop: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontFamily: 'montserrat_bold', fontSize: 32, letterSpacing: 0.5 },
  iconButton: { padding: 5 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 25, borderRadius: 25, borderWidth: 1, paddingHorizontal: 15, height: 50, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 14 },
  
  sectionHeader: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontFamily: 'montserrat_bold', fontSize: 18 },
  
  heroSection: { marginBottom: 25 },
  heroCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  heroImageContainer: { height: 180, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  badgeContainer: { position: 'absolute', top: 15, left: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#FFF', fontFamily: 'montserrat_bold', fontSize: 12 },
  heroContent: { padding: 18 },
  heroTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 4 },
  heroSubtitle: { fontFamily: 'montserrat_regular', fontSize: 13 },
  
  horizontalScroll: { paddingLeft: 20, marginBottom: 30 },
  
  categoryItem: { alignItems: 'center', marginRight: 25, width: 65 },
  categoryCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, marginBottom: 8 },
  categoryText: { fontFamily: 'montserrat_medium', fontSize: 12, textAlign: 'center' },

  modernCard: { 
    width: width * 0.45, 
    height: 200, 
    marginRight: 15, 
    borderRadius: 20, 
    overflow: 'hidden', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    marginBottom: 10 
  },
  modernCardImageContainer: { width: '100%', height: 110, position: 'relative' },
  modernCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  modernCardContent: { 
    padding: 12,
    flex: 1, 
    justifyContent: 'space-between' 
  },
  modernCardTitle: { 
    fontFamily: 'montserrat_bold', 
    fontSize: 14, 
    lineHeight: 18, 
    marginBottom: 4, 
  },  
  subtitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  vegIconBorder: { width: 12, height: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
  vegIconDot: { width: 6, height: 6 },
  modernCardSubtitle: { fontFamily: 'montserrat_regular', fontSize: 11, flex: 1 },

  popularSection: { marginBottom: 10 },
  
  popularCard: { 
    width: 140, 
    height: 220, 
    marginRight: 15, 
    borderRadius: 16, 
    padding: 10, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 3, 
    marginBottom: 5 
  },
  popularImageContainer: { width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', position: 'relative', marginBottom: 10 },
  popularImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  addButton: { position: 'absolute', bottom: 5, right: 5, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  
  popularContent: { 
    paddingHorizontal: 2,
    flex: 1,
    justifyContent: 'space-between'
  },
  popularTitle: { fontFamily: 'montserrat_bold', fontSize: 13, marginBottom: 3 },
  popularPrice: { fontFamily: 'montserrat_bold', fontSize: 14, marginBottom: 4 },
  popularRestaurant: { fontFamily: 'montserrat_regular', fontSize: 10},

  closedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  closedText: { color: 'white', fontFamily: 'montserrat_bold', fontSize: 24, letterSpacing: 2 },
  closedOverlaySmall: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  closedTextSmall: { color: 'white', fontFamily: 'montserrat_bold', fontSize: 14, letterSpacing: 1 },

  skeletonBlock: { borderRadius: 8 }
});

export default Home;