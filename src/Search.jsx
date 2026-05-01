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

  const [activeChip, setActiveChip] = useState('All');
  const filterChips = ['All', 'Veg only', 'Under ₹100', 'Rating 4+', 'Starters', 'Main course'];

  const courseOptions = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  const varietyOptions = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Fast Food'];

  // LOGIC CHANGE: Synced the Smart Markup Engine to Search.jsx
  const getMarkupPrice = (price, markup) => {
    const rawPrice = parseFloat(price || 0);
    let safeMarkup = (markup !== undefined && markup !== null) ? parseFloat(markup) : 30;
    if (safeMarkup === 30 && rawPrice < 100) safeMarkup = 20;
    const calculated = Math.ceil(rawPrice * (1 + (safeMarkup / 100)));
    return isNaN(calculated) ? 0 : calculated;
  };
  
  useEffect(() => { 
    if (categoryQuery) { 
      setSearchText(categoryQuery); 
      fetchByCategory(categoryQuery); 
    } else { 
      loadInitialData(); 
    } 
  }, [categoryQuery]);

  const loadInitialData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('localbites_search_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed && parsed.length > 0) {
          setItems(parsed);
          setLoading(false); 
        }
      }
    } catch (e) { console.log("Cache Error", e); }

    try {
      const { data, error } = await supabase.from('menu_items').select('*, restaurants(*)'); 
      if (error) throw error; 
      
      const activeItems = data ? data.filter(item => item.is_deleted !== true) : [];
      
      if (JSON.stringify(activeItems) !== await AsyncStorage.getItem('localbites_search_cache')) {
          setItems(activeItems);
          AsyncStorage.setItem('localbites_search_cache', JSON.stringify(activeItems));
      }
    } catch (error) { 
      console.error(error.message); 
    } finally { 
      setLoading(false); 
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
    
    let matchesChip = true;
    if (activeChip === 'Veg only') matchesChip = item.is_veg === true;
    // LOGIC CHANGE: Uses the correct smart logic to filter items under 100
    if (activeChip === 'Under ₹100') matchesChip = getMarkupPrice(item.price, item.markup_percentage) < 100;
    if (activeChip === 'Rating 4+') matchesChip = (item.rating || (item.restaurants && item.restaurants.rating) || 0) >= 4;
    if (activeChip === 'Starters') matchesChip = item.course === 'Starters';
    if (activeChip === 'Main course') matchesChip = item.course === 'Main Course';
    
    return matchesSearch && matchesCourse && matchesVariety && matchesVeg && matchesChip;
  });

  const handleCoursePress = (filter) => setActiveCourseFilter(activeCourseFilter === filter ? null : filter);
  const handleVarietyPress = (filter) => setActiveVarietyFilter(activeVarietyFilter === filter ? null : filter);

  const toggleFilterMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? theme.bg : '#F7F6F2' }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.topBar}>
          <View style={[styles.skeletonBlock, { width: 40, height: 40, backgroundColor: theme.border, borderRadius: 20 }]} />
          <View style={[styles.skeletonBlock, { width: 150, height: 24, backgroundColor: theme.border }]} />
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.searchWrapper}>
           <View style={[styles.skeletonBlock, styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]} />
        </View>
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
             <View key={i} style={[styles.skeletonBlock, styles.gridCard, { height: 200, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 16 }]} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? theme.bg : '#F7F6F2' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Find your food</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? theme.card : '#fff', borderColor: isDarkMode ? theme.border : '#e0ddd5' }]}>
          <AntDesign name="search1" size={18} color={theme.subText} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search dishes or restaurants..." 
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
          <TouchableOpacity 
             style={styles.inlineFilterBtn} 
             onPress={toggleFilterMenu}
          >
            <Feather name="sliders" size={14} color="#d4f570" />
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={{ paddingRight: 20 }}>
          {filterChips.map((chip) => (
            <TouchableOpacity 
              key={chip} 
              style={[
                styles.chip, 
                activeChip === chip ? styles.chipActive : { backgroundColor: isDarkMode ? theme.card : '#fff', borderColor: isDarkMode ? theme.border : '#e0ddd5' }
              ]} 
              onPress={() => setActiveChip(chip)}
            >
              <Text style={[styles.chipText, activeChip === chip ? styles.chipTextActive : { color: theme.text }]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

      <View style={styles.resultsRow}>
        <Text style={[styles.resCount, { color: theme.subText }]}>{filteredItems.length} results</Text>
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={[styles.sortBtnText, { color: theme.text }]}>Relevance</Text>
          <AntDesign name="caretdown" size={10} color={theme.subText} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              // LOGIC CHANGE: Apply Smart Math and calculate Fake Discount UI properties
              const finalPrice = getMarkupPrice(item.price, item.markup_percentage);
              let slashedDisplay = null;
              let discountBadge = null;
              
              if (item.slashed_price && parseFloat(item.slashed_price) > finalPrice) {
                slashedDisplay = parseFloat(item.slashed_price);
                const percentageOff = Math.round(((slashedDisplay - finalPrice) / slashedDisplay) * 100);
                discountBadge = `${percentageOff}% OFF`;
              }

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.gridCard, { backgroundColor: isDarkMode ? theme.card : '#fff', borderColor: isDarkMode ? theme.border : '#ede9e0', borderWidth: 0.5 }]} 
                  onPress={() => navigation.navigate('Details', { restaurant: item.restaurants, autoSelectItem: item })}
                >
                  <View style={styles.cardImageContainer}>
                    <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                    
                    {/* UI CHANGE: Add Discount Badge over the image like Swiggy */}
                    {discountBadge && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{discountBadge}</Text>
                      </View>
                    )}

                    <View style={styles.frostedBadge}>
                      <Text style={styles.frostedBadgeText}>{item.course || 'Food'}</Text>
                    </View>

                    <View style={styles.vegIndicatorTopRight}>
                      <View style={[styles.newVegBorder, { borderColor: item.is_veg ? '#3a8a00' : '#e23744' }]}>
                         <View style={[styles.newVegDot, { backgroundColor: item.is_veg ? '#3a8a00' : '#e23744', borderRadius: 50 }]} />
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.restaurantNameLabel, { color: theme.subText }]} numberOfLines={1}>
                      {item.restaurants ? item.restaurants.name : 'Local'}
                    </Text>
                    <View style={styles.bottomRow}>
                      {/* UI CHANGE: Inject the slashed price row styling */}
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.priceText, { color: theme.text }]}>₹{finalPrice}</Text>
                        {slashedDisplay && (
                          <Text style={[styles.slashedPriceText, { color: theme.subText, fontSize: 11, marginLeft: 4 }]}>₹{slashedDisplay}</Text>
                        )}
                      </View>
                      
                      <View style={styles.newAddButton}>
                        <Text style={styles.newAddButtonText}>+</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
            )})
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
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 18, letterSpacing: -0.3 },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 0.5, paddingLeft: 14, paddingRight: 6, height: 46 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 13, height: '100%' },
  inlineFilterBtn: { backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chipsScroll: { paddingHorizontal: 20, marginBottom: 15 },
  chip: { borderWidth: 0.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  chipActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  chipText: { fontSize: 11, fontFamily: 'montserrat_medium' },
  chipTextActive: { color: '#d4f570' },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  resCount: { fontSize: 12, fontFamily: 'montserrat_regular' },
  sortBtn: { flexDirection: 'row', alignItems: 'center' },
  sortBtnText: { fontSize: 12, fontFamily: 'montserrat_medium' },
  filterMenuContainer: { paddingBottom: 15 },
  vegToggleContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  vegChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  vegDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', marginRight: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  vegText: { fontFamily: 'montserrat_bold', fontSize: 12 },
  filterScroll: { paddingLeft: 20 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  filterText: { fontFamily: 'montserrat_medium', fontSize: 13 },
  gridContainer: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: (width - 55) / 2, borderRadius: 16, marginBottom: 15, overflow: 'hidden' },
  cardImageContainer: { width: '100%', height: 120, position: 'relative' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  frostedBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  frostedBadgeText: { color: '#333', fontSize: 9, fontFamily: 'montserrat_bold', letterSpacing: 0.2 },
  vegIndicatorTopRight: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)', padding: 3, borderRadius: 4 },
  newVegBorder: { width: 10, height: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
  newVegDot: { width: 5, height: 5 },
  cardContent: { padding: 10 },
  itemName: { fontFamily: 'montserrat_bold', fontSize: 13, marginBottom: 2 },
  restaurantNameLabel: { fontSize: 11, fontFamily: 'montserrat_medium', marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontFamily: 'montserrat_bold', fontSize: 14 },
  // UI CHANGE: Added Slashed Price CSS
  slashedPriceText: { fontFamily: 'montserrat_regular', fontSize: 13, textDecorationLine: 'line-through' },
  // UI CHANGE: Added Discount Badge CSS
  discountBadge: { position: 'absolute', bottom: 0, left: 0, backgroundColor: '#e23744', paddingHorizontal: 6, paddingVertical: 4, borderTopRightRadius: 8 },
  discountBadgeText: { color: '#FFF', fontFamily: 'montserrat_bold', fontSize: 10 },
  newAddButton: { width: 26, height: 26, backgroundColor: '#a3d45f', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  newAddButtonText: { fontSize: 18, color: '#1a2e00', lineHeight: 20, marginTop: -2 },
  emptyState: { width: '100%', alignItems: 'center', marginTop: 40 },
  noResultsText: { marginTop: 10, fontFamily: 'montserrat_medium' },
  skeletonBlock: { borderRadius: 16 }
});

export default Search;