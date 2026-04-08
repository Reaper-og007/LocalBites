import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Dimensions, Platform, StatusBar, LayoutAnimation } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const Search = ({ navigation, route }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { categoryQuery } = route.params || {};
  
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [showFilters, setShowFilters] = useState(false);
  const [vegFilter, setVegFilter] = useState('All'); 

  const [activeCourseFilter, setActiveCourseFilter] = useState(null);
  const [activeVarietyFilter, setActiveVarietyFilter] = useState(null);

  const courseOptions = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  const varietyOptions = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Fast Food'];

  const getMarkupPrice = (originalPrice) => { 
    const price = parseFloat(originalPrice); 
    if (isNaN(price)) return 0; 
    return Math.ceil(price * 1.20); 
  };
  
  useEffect(() => { 
    if (categoryQuery) { 
      setSearchText(categoryQuery); 
      fetchByCategory(categoryQuery); 
    } else { 
      loadInitialData(); 
    } 
  }, [categoryQuery]);

  // CHANGE: Optimized Data Loading Logic
  const loadInitialData = async () => {
    // 1. Try to get cache first
    try {
      const cachedData = await AsyncStorage.getItem('localbites_search_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed && parsed.length > 0) {
          setItems(parsed);
          setLoading(false); // CHANGE: Kill loading instantly if cache exists
        }
      }
    } catch (e) { console.log("Cache Error", e); }

    // 2. Perform background fetch
    try {
      const { data, error } = await supabase.from('menu_items').select('*, restaurants(*)'); 
      if (error) throw error; 
      
      const activeItems = data ? data.filter(item => item.is_deleted !== true) : [];
      
      // CHANGE: Only update state if the data actually changed to save CPU cycles
      if (JSON.stringify(activeItems) !== await AsyncStorage.getItem('localbites_search_cache')) {
          setItems(activeItems);
          AsyncStorage.setItem('localbites_search_cache', JSON.stringify(activeItems));
      }
    } catch (error) { 
      console.error(error.message); 
    } finally { 
      setLoading(false); // Ensure loading is off even if fetch fails
    } 
  };

  const fetchByCategory = async (cat) => { 
    setLoading(true); 
    try { 
      const { data, error } = await supabase.from('menu_items').select('*, restaurants(*)').eq('category', cat); 
      if (error) throw error; 
      setItems(data ? data.filter(item => item.is_deleted !== true) : []); 
    } catch (error) { 
      console.error(error.message); 
    } finally { 
      setLoading(false); 
    } 
  };

  const filteredItems = items.filter((item) => {
    const lowerText = searchText.toLowerCase();
    const matchesSearch = !searchText || item.name.toLowerCase().includes(lowerText) || (item.category && item.category.toLowerCase().includes(lowerText)) || (item.restaurants && item.restaurants.name.toLowerCase().includes(lowerText));
    const matchesCourse = !activeCourseFilter || (item.course && item.course === activeCourseFilter);
    const matchesVariety = !activeVarietyFilter || (item.variety && item.variety === activeVarietyFilter);
    const matchesVeg = vegFilter === 'All' || (vegFilter === 'Veg' ? item.is_veg === true : item.is_veg === false);
    
    return matchesSearch && matchesCourse && matchesVariety && matchesVeg;
  });

  const handleCoursePress = (filter) => setActiveCourseFilter(activeCourseFilter === filter ? null : filter);
  const handleVarietyPress = (filter) => setActiveVarietyFilter(activeVarietyFilter === filter ? null : filter);

  const toggleFilterMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  // CHANGE: Conditional rendering - Only show skeleton if we have NO items and are loading
  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.topBar}>
          <View style={[styles.skeletonBlock, { width: 40, height: 40, backgroundColor: theme.border, borderRadius: 20 }]} />
          <View style={[styles.skeletonBlock, { width: 150, height: 24, backgroundColor: theme.border }]} />
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.searchWrapper}>
           <View style={[styles.skeletonBlock, styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]} />
           <View style={[styles.skeletonBlock, styles.filterIconBtn, { backgroundColor: theme.border }]} />
        </View>
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
             <View key={i} style={[styles.skeletonBlock, styles.gridCard, { height: 200, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Find Your Food</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <AntDesign name="search1" size={20} color={theme.subText} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for dishes..." 
            placeholderTextColor={theme.subText} 
            style={[styles.searchInput, { color: theme.text }]} 
            autoFocus={!categoryQuery} 
            value={searchText} 
            onChangeText={setSearchText} 
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {setSearchText(''); loadInitialData();}} style={{ padding: 5 }}>
              <AntDesign name="closecircle" size={16} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
           style={[styles.filterIconBtn, { backgroundColor: showFilters ? theme.text : theme.accent }]} 
           onPress={toggleFilterMenu}
        >
          <Feather name={showFilters ? "x" : "sliders"} size={20} color={showFilters ? theme.bg : "#FFF"} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterMenuContainer}>
          <View style={styles.vegToggleContainer}>
             {['All', 'Veg', 'Non-Veg'].map((type) => (
               <TouchableOpacity 
                 key={type}
                 onPress={() => setVegFilter(type)}
                 style={[
                   styles.vegChip, 
                   { backgroundColor: theme.card, borderColor: theme.border },
                   vegFilter === type && { backgroundColor: type === 'Veg' ? '#0f8a46' : type === 'Non-Veg' ? '#e23744' : theme.accent, borderColor: 'transparent' }
                 ]}
               >
                 {type === 'Veg' && <View style={styles.vegDot} />}
                 {type === 'Non-Veg' && <View style={[styles.vegDot, { backgroundColor: '#FFF' }]} />}
                 <Text style={[styles.vegText, { color: theme.text }, vegFilter === type && { color: '#FFF' }]}>{type}</Text>
               </TouchableOpacity>
             ))}
          </View>

          <View style={{ maxHeight: 110, marginTop: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{paddingRight: 20}}>
              {courseOptions.map((opt, i) => (
                  <TouchableOpacity key={i} style={[styles.filterChip, { backgroundColor: theme.card, borderColor: theme.border }, activeCourseFilter === opt && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => handleCoursePress(opt)}>
                      <Text style={[styles.filterText, { color: theme.text }, activeCourseFilter === opt && { color: '#FFF', fontFamily: 'montserrat_bold' }]}>{opt}</Text>
                  </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, {marginTop: 8}]} contentContainerStyle={{paddingRight: 20}}>
              {varietyOptions.map((opt, i) => (
                  <TouchableOpacity key={i} style={[styles.filterChip, { backgroundColor: theme.card, borderColor: theme.border }, activeVarietyFilter === opt && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => handleVarietyPress(opt)}>
                      <Text style={[styles.filterText, { color: theme.text }, activeVarietyFilter === opt && { color: '#FFF', fontFamily: 'montserrat_bold' }]}>{opt}</Text>
                  </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <Text style={[styles.pageTitle, { color: theme.text }]}>
        {filteredItems.length} Results Found
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.gridCard, { backgroundColor: theme.card }]} 
                  onPress={() => navigation.navigate('Details', { restaurant: item.restaurants, autoSelectItem: item })}
                >
                  <View style={styles.cardImageContainer}>
                    <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                    <View style={styles.badgeOverlay}>
                      <View style={[styles.miniVegBorder, { borderColor: item.is_veg ? '#0f8a46' : '#e23744' }]}>
                         <View style={[styles.miniVegDot, { backgroundColor: item.is_veg ? '#0f8a46' : '#e23744', borderRadius: item.is_veg ? 2 : 50 }]} />
                      </View>
                    </View>
                    <View style={styles.courseBadge}>
                      <Text style={styles.courseText}>{item.course || 'Food'}</Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.restaurantNameLabel, { color: theme.subText }]} numberOfLines={1}>
                      {item.restaurants ? item.restaurants.name : 'Local'}
                    </Text>
                    <View style={styles.bottomRow}>
                      <Text style={[styles.priceText, { color: theme.text }]}>₹{getMarkupPrice(item.price)}</Text>
                      <View style={[styles.addButton, { backgroundColor: theme.accent }]}>
                        <AntDesign name="plus" size={14} color="#FFF" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
               <MaterialCommunityIcons name="food-off" size={60} color={theme.border} />
               <Text style={[styles.noResultsText, { color: theme.subText }]}>No dishes found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  scrollContent: { paddingBottom: 30 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 20 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 25, borderWidth: 1, paddingHorizontal: 15, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 14 },
  filterIconBtn: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  filterMenuContainer: { paddingBottom: 15 },
  vegToggleContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  vegChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  vegDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', marginRight: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  vegText: { fontFamily: 'montserrat_bold', fontSize: 12 },
  filterScroll: { paddingLeft: 20 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  filterText: { fontFamily: 'montserrat_medium', fontSize: 13 },
  pageTitle: { fontFamily: 'montserrat_bold', fontSize: 16, marginHorizontal: 20, marginBottom: 15, marginTop: 15 },
  gridContainer: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: (width - 55) / 2, borderRadius: 24, marginBottom: 20, elevation: 4, overflow: 'hidden' },
  cardImageContainer: { width: '100%', height: 130, position: 'relative' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  badgeOverlay: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 4, borderRadius: 4 },
  miniVegBorder: { width: 12, height: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  miniVegDot: { width: 5, height: 5 },
  courseBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  courseText: { color: '#FFF', fontSize: 10, fontFamily: 'montserrat_bold' },
  cardContent: { padding: 12 },
  itemName: { fontFamily: 'montserrat_bold', fontSize: 14, marginBottom: 2 },
  restaurantNameLabel: { fontSize: 11, fontFamily: 'montserrat_medium', marginBottom: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontFamily: 'montserrat_bold', fontSize: 16 },
  addButton: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  emptyState: { width: '100%', alignItems: 'center', marginTop: 40 },
  noResultsText: { marginTop: 10, fontFamily: 'montserrat_medium' },
  skeletonBlock: { borderRadius: 8 }
});

export default Search;