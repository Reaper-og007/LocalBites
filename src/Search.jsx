import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { supabase } from './lib/supabase';

const Search = ({ navigation, route }) => {
  const { categoryQuery } = route.params || {};

  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // New Filters
  const [activeCourseFilter, setActiveCourseFilter] = useState(null);
  const [activeVarietyFilter, setActiveVarietyFilter] = useState(null);

  const courseOptions = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  const varietyOptions = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Fast Food'];

  // --- PRICING LOGIC: Automatic 20% Markup ---
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
      fetchAllItems();
    }
  }, [categoryQuery]);

  const fetchAllItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, restaurants(*)'); 
        
      if (error) throw error;
      const validItems = data ? data.filter(item => item.is_deleted !== true) : [];
      setItems(validItems);
    } catch (error) {
      console.error('Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchByCategory = async (cat) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, restaurants(*)') 
        .eq('category', cat); 
        
      if (error) throw error;
      const validItems = data ? data.filter(item => item.is_deleted !== true) : [];
      setItems(validItems);
    } catch (error) {
      console.error('Category Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const lowerText = searchText.toLowerCase();
    
    const matchesSearch = !searchText || 
        item.name.toLowerCase().includes(lowerText) || 
        (item.category && item.category.toLowerCase().includes(lowerText)) ||
        (item.restaurants && item.restaurants.name.toLowerCase().includes(lowerText));

    const matchesCourse = !activeCourseFilter || (item.course && item.course === activeCourseFilter);
    const matchesVariety = !activeVarietyFilter || (item.variety && item.variety === activeVarietyFilter);

    return matchesSearch && matchesCourse && matchesVariety;
  });

  const handleCoursePress = (filter) => {
    setActiveCourseFilter(activeCourseFilter === filter ? null : filter);
  };

  const handleVarietyPress = (filter) => {
    setActiveVarietyFilter(activeVarietyFilter === filter ? null : filter);
  };

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#82D428" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search for dishes (Pizza, Biryani...)"
          placeholderTextColor="#888"
          style={styles.searchInput}
          autoFocus={!categoryQuery}
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => {setSearchText(''); fetchAllItems();}}>
            <AntDesign name="closecircle" size={16} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* --- NEW FILTERS SECTION --- */}
      <View style={{ maxHeight: 100 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{paddingRight: 20}}>
            {courseOptions.map((opt, i) => (
                <TouchableOpacity 
                    key={i} 
                    style={[styles.filterChip, activeCourseFilter === opt && styles.activeFilterChip]} 
                    onPress={() => handleCoursePress(opt)}
                >
                    <Text style={[styles.filterText, activeCourseFilter === opt && styles.activeFilterText]}>{opt}</Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, {marginTop: 5}]} contentContainerStyle={{paddingRight: 20}}>
            {varietyOptions.map((opt, i) => (
                <TouchableOpacity 
                    key={i} 
                    style={[styles.filterChip, activeVarietyFilter === opt && styles.activeFilterChip]} 
                    onPress={() => handleVarietyPress(opt)}
                >
                    <Text style={[styles.filterText, activeVarietyFilter === opt && styles.activeFilterText]}>{opt}</Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
      </View>

      <Text style={styles.pageTitle}>
          {filteredItems.length} Results Found
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
                <TouchableOpacity 
                    key={item.id} 
                    style={styles.card}
                    onPress={() => navigation.navigate('Details', { restaurant: item.restaurants })}
                >
                <Image source={{ uri: item.image_url }} style={styles.cardImage} />

                <View style={styles.cardContent}>
                    <View style={styles.infoColumn}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.badgeRow}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryLabel}>{item.category || 'Food'}</Text>
                          </View>
                          {item.course && (
                              <View style={[styles.categoryBadge, {marginLeft: 5, backgroundColor: '#E0F7FA'}]}>
                                <Text style={[styles.categoryLabel, {color: '#006064'}]}>{item.course}</Text>
                              </View>
                          )}
                      </View>

                      {/* MARKUP APPLIED HERE */}
                      <Text style={styles.priceText}>₹{getMarkupPrice(item.price)}</Text>
                      
                      <Text style={styles.restaurantNameLabel}>
                        by {item.restaurants ? item.restaurants.name : 'Unknown Restaurant'}
                      </Text>
                    </View>
                    
                    <AntDesign name="pluscircle" size={24} color="#82D428" />
                </View>
                </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResultsText}>No dishes found with these filters.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 30 },
  scrollContent: { paddingBottom: 20 },
  topBar: { paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, borderRadius: 30, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 15, height: 50, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 16, color: '#000' },
  filterScroll: { paddingLeft: 20, marginBottom: 8 },
  filterChip: { backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  activeFilterChip: { backgroundColor: '#82D428', borderColor: '#82D428' },
  filterText: { fontFamily: 'montserrat_medium', fontSize: 13, color: '#666' },
  activeFilterText: { color: '#000', fontFamily: 'montserrat_bold' },
  pageTitle: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#000', marginHorizontal: 20, marginBottom: 15, marginTop: 5 },
  listContainer: { paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, elevation: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: 150 },
  cardContent: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoColumn: { flex: 1 },
  itemName: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#000' },
  badgeRow: { flexDirection: 'row', marginTop: 5 },
  categoryBadge: { backgroundColor: '#F0F0F0', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  categoryLabel: { fontSize: 12, color: '#666', fontFamily: 'montserrat_medium' },
  priceText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#82D428', marginTop: 5 },
  restaurantNameLabel: { fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic', fontFamily: 'montserrat_regular' },
  noResultsText: { textAlign: 'center', marginTop: 40, color: '#888', fontFamily: 'montserrat_regular' }
});

export default Search;