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
      console.log("Popular Items Error:", error.message); 
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

  const getMarkupPrice = (price, markup) => {
    const rawPrice = parseFloat(price || 0);
    let safeMarkup = (markup !== undefined && markup !== null) ? parseFloat(markup) : 30;
    if (safeMarkup === 30 && rawPrice < 100) safeMarkup = 20;
    const calculated = Math.ceil(rawPrice * (1 + (safeMarkup / 100)));
    return isNaN(calculated) ? 0 : calculated;
  };

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

  let topPicksArray = restaurants.filter(r => r.is_featured === true);
  if (topPicksArray.length === 0 && restaurants.length > 0) topPicksArray = restaurants.slice(0, 3);
  const nearbyRestaurants = restaurants.filter(r => !topPicksArray.some(topPick => topPick.id === r.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingSub, { color: theme.subText }]}>Hello!</Text>
            <Text style={[styles.greetingMain, { color: theme.text }]}>What's on Menu? 🍽</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
              <Feather name={isDarkMode ? "sun" : "moon"} size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconButton}>
              <Feather name="user" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.7} onPress={() => navigation.navigate('Search')}>
          <AntDesign name="search1" size={20} color={theme.subText} style={styles.searchIcon} />
          <TextInput placeholder="Search for food or restaurants" placeholderTextColor={theme.subText} style={[styles.searchInput, { color: theme.text }]} editable={false} pointerEvents="none" />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 20 }}>
          <View style={[styles.catChip, { backgroundColor: theme.text, borderColor: theme.text }]}>
            <Text style={[styles.catChipText, { color: theme.bg }]}>All</Text>
          </View>
          {categories.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.catChip, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Search', { categoryQuery: item.name })}>
              <Text style={[styles.catChipText, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {topPicksArray.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Top picks this week</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20 }}>
              {topPicksArray.map((rest, index) => {
                const isRestOpen = checkIsRestaurantOpen(rest);
                return (
                  <TouchableOpacity key={`top-${rest.id || index}`} style={[styles.featCard, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Details', { restaurant: rest })}>
                    <View style={styles.featImageContainer}>
                      <Image source={{ uri: rest.image_url }} style={styles.featImage} />
                      {!isRestOpen ? (
                        <View style={styles.closedPillTop}><Text style={styles.closedPillTextTop}>CLOSED</Text></View>
                      ) : (
                        <View style={styles.topPickBadge}><Text style={styles.topPickBadgeText}>⭐ Top Pick</Text></View>
                      )}
                    </View>
                    
                    <View style={styles.featContent}>
                      <Text style={[styles.featTitle, { color: theme.text }]} numberOfLines={2}>{rest.name}</Text>
                      <View style={styles.featMeta}>
                        <Text style={[styles.featSubtitle, { color: theme.subText }]} numberOfLines={1}>{rest.location || 'Local'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Restaurants near you</Text>
          </View>
          
          <View style={styles.verticalListContainer}>
            {nearbyRestaurants.map((rest) => {
              const isRestOpen = checkIsRestaurantOpen(rest);
              return (
                <TouchableOpacity key={`list-${rest.id}`} style={[styles.listRow, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Details', { restaurant: rest })}>
                  <Image source={{ uri: rest.image_url }} style={styles.listThumb} />
                  
                  <View style={styles.listInfo}>
                    <Text style={[styles.listName, { color: theme.text }]} numberOfLines={2}>{rest.name}</Text>
                    <Text style={[styles.listSub, { color: theme.subText }]} numberOfLines={1}>
                      {rest.is_veg ? 'Pure Veg' : 'Non-Veg'} • {rest.location || 'Local'}
                    </Text>
                  </View>
                  
                  <View style={styles.listRight}>
                    {isRestOpen ? (
                      <View style={styles.badgeOpen}><Text style={styles.badgeOpenText}>OPEN</Text></View>
                    ) : (
                      <View style={styles.badgeClosed}><Text style={styles.badgeClosedText}>Opens {rest.open_time ? rest.open_time.substring(0, 5) : 'soon'}</Text></View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {popularItems.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Most Popular Items</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20 }}>
              {popularItems.map((item) => {
                const finalPrice = getMarkupPrice(item.price, item.markup_percentage);
                let slashedDisplay = null;
                if (item.slashed_price && parseFloat(item.slashed_price) > finalPrice) {
                  slashedDisplay = parseFloat(item.slashed_price);
                }

                return (
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.popularPrice, { color: theme.text }]}>₹{finalPrice}</Text>
                          {slashedDisplay && (
                            <Text style={[styles.slashedPriceText, { color: theme.subText, fontSize: 11, marginLeft: 4 }]}>₹{slashedDisplay}</Text>
                          )}
                        </View>
                      </View>
                      <Text style={[styles.popularRestaurant, { color: theme.subText }]} numberOfLines={2}>
                        {item.restaurants?.name || 'Local Restaurant'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
  greetingSub: { fontFamily: 'montserrat_regular', fontSize: 13, marginBottom: 2 },
  greetingMain: { fontFamily: 'montserrat_bold', fontSize: 20, letterSpacing: -0.4 },
  iconButton: { padding: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 15, borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 15, height: 45 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 13 },
  chipScroll: { paddingLeft: 20, marginBottom: 20 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  catChipText: { fontFamily: 'montserrat_medium', fontSize: 12 },
  sectionContainer: { marginBottom: 20 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'montserrat_bold', fontSize: 16, letterSpacing: -0.2 },
  horizontalScroll: { paddingLeft: 20 },
  featCard: { width: 220, marginRight: 12, borderRadius: 16, overflow: 'hidden' },
  featImageContainer: { height: 110, width: '100%', position: 'relative' },
  featImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  topPickBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  topPickBadgeText: { color: '#FFF', fontFamily: 'montserrat_bold', fontSize: 10 },
  closedPillTop: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(229, 29, 29, 0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  closedPillTextTop: { color: '#FFF', fontFamily: 'montserrat_bold', fontSize: 10, letterSpacing: 0.5 },
  featContent: { padding: 12 },
  // UI CHANGE: Added a fixed height of 36 to force 2 lines of space always, perfectly aligning the Zorko card with others.
  featTitle: { fontFamily: 'montserrat_bold', fontSize: 14, marginBottom: 4, height: 36 },
  featMeta: { flexDirection: 'row', alignItems: 'center' },
  featSubtitle: { fontFamily: 'montserrat_regular', fontSize: 11 },
  verticalListContainer: { paddingHorizontal: 20 },
  listRow: { flexDirection: 'row', padding: 12, borderRadius: 14, marginBottom: 10, alignItems: 'center' },
  listThumb: { width: 56, height: 56, borderRadius: 12, marginRight: 12, backgroundColor: '#e8e4d8' },
  listInfo: { flex: 1, justifyContent: 'center' },
  listName: { fontFamily: 'montserrat_bold', fontSize: 14, marginBottom: 4 },
  listSub: { fontFamily: 'montserrat_regular', fontSize: 11 },
  listRight: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 },
  badgeOpen: { backgroundColor: '#eafad0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeOpenText: { color: '#3d7a00', fontFamily: 'montserrat_bold', fontSize: 9 },
  badgeClosed: { backgroundColor: '#f5f0e8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeClosedText: { color: '#b08030', fontFamily: 'montserrat_bold', fontSize: 9 },
  popularCard: { width: 140, height: 210, marginRight: 15, borderRadius: 16, padding: 10, marginBottom: 5 },
  popularImageContainer: { width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', position: 'relative', marginBottom: 10 },
  popularImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  addButton: { position: 'absolute', bottom: 5, right: 5, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  popularContent: { paddingHorizontal: 2, flex: 1, justifyContent: 'space-between' },
  popularTitle: { fontFamily: 'montserrat_bold', fontSize: 13, marginBottom: 3 },
  popularPrice: { fontFamily: 'montserrat_bold', fontSize: 14, marginBottom: 4 },
  slashedPriceText: { fontFamily: 'montserrat_regular', fontSize: 13, textDecorationLine: 'line-through' },
  popularRestaurant: { fontFamily: 'montserrat_regular', fontSize: 10 },
  skeletonBlock: { borderRadius: 12 }
});

export default Home;