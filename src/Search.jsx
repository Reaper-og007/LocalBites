import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';

const Search = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  /* ... Keep your exact same state and logic functions ... */
  const { categoryQuery } = route.params || {};
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeCourseFilter, setActiveCourseFilter] = useState(null);
  const [activeVarietyFilter, setActiveVarietyFilter] = useState(null);
  const courseOptions = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  const varietyOptions = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Fast Food'];

  const getMarkupPrice = (originalPrice) => { const price = parseFloat(originalPrice); if (isNaN(price)) return 0; return Math.ceil(price * 1.20); };
  
  useEffect(() => { if (categoryQuery) { setSearchText(categoryQuery); fetchByCategory(categoryQuery); } else { fetchAllItems(); } }, [categoryQuery]);
  const fetchAllItems = async () => { setLoading(true); try { const { data, error } = await supabase.from('menu_items').select('*, restaurants(*)'); if (error) throw error; setItems(data ? data.filter(item => item.is_deleted !== true) : []); } catch (error) { console.error(error.message); } finally { setLoading(false); } };
  const fetchByCategory = async (cat) => { setLoading(true); try { const { data, error } = await supabase.from('menu_items').select('*, restaurants(*)').eq('category', cat); if (error) throw error; setItems(data ? data.filter(item => item.is_deleted !== true) : []); } catch (error) { console.error(error.message); } finally { setLoading(false); } };

  const filteredItems = items.filter((item) => {
    const lowerText = searchText.toLowerCase();
    const matchesSearch = !searchText || item.name.toLowerCase().includes(lowerText) || (item.category && item.category.toLowerCase().includes(lowerText)) || (item.restaurants && item.restaurants.name.toLowerCase().includes(lowerText));
    const matchesCourse = !activeCourseFilter || (item.course && item.course === activeCourseFilter);
    const matchesVariety = !activeVarietyFilter || (item.variety && item.variety === activeVarietyFilter);
    return matchesSearch && matchesCourse && matchesVariety;
  });

  const handleCoursePress = (filter) => setActiveCourseFilter(activeCourseFilter === filter ? null : filter);
  const handleVarietyPress = (filter) => setActiveVarietyFilter(activeVarietyFilter === filter ? null : filter);

  if (loading) return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: theme.bg}}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="left" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AntDesign name="search1" size={20} color={theme.subText} style={styles.searchIcon} />
        <TextInput placeholder="Search for dishes (Pizza, Biryani...)" placeholderTextColor={theme.subText} style={[styles.searchInput, { color: theme.text }]} autoFocus={!categoryQuery} value={searchText} onChangeText={setSearchText} />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => {setSearchText(''); fetchAllItems();}}>
            <AntDesign name="closecircle" size={16} color={theme.subText} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ maxHeight: 100 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{paddingRight: 20}}>
            {courseOptions.map((opt, i) => (
                <TouchableOpacity key={i} style={[styles.filterChip, { backgroundColor: theme.card, borderColor: theme.border }, activeCourseFilter === opt && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => handleCoursePress(opt)}>
                    <Text style={[styles.filterText, { color: theme.text }, activeCourseFilter === opt && { color: theme.accentText, fontFamily: 'montserrat_bold' }]}>{opt}</Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, {marginTop: 5}]} contentContainerStyle={{paddingRight: 20}}>
            {varietyOptions.map((opt, i) => (
                <TouchableOpacity key={i} style={[styles.filterChip, { backgroundColor: theme.card, borderColor: theme.border }, activeVarietyFilter === opt && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => handleVarietyPress(opt)}>
                    <Text style={[styles.filterText, { color: theme.text }, activeVarietyFilter === opt && { color: theme.accentText, fontFamily: 'montserrat_bold' }]}>{opt}</Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
      </View>

      <Text style={[styles.pageTitle, { color: theme.text }]}>{filteredItems.length} Results Found</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Details', { restaurant: item.restaurants })}>
                <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                    <View style={styles.infoColumn}>
                      <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                      <View style={styles.badgeRow}>
                          <View style={[styles.categoryBadge, { backgroundColor: theme.border }]}>
                            <Text style={[styles.categoryLabel, { color: theme.subText }]}>{item.category || 'Food'}</Text>
                          </View>
                          {item.course && (
                              <View style={[styles.categoryBadge, {marginLeft: 5, backgroundColor: theme.accent}]}>
                                <Text style={[styles.categoryLabel, {color: theme.accentText}]}>{item.course}</Text>
                              </View>
                          )}
                      </View>
                      <Text style={[styles.priceText, { color: theme.text }]}>₹{getMarkupPrice(item.price)}</Text>
                      <Text style={[styles.restaurantNameLabel, { color: theme.subText }]}>by {item.restaurants ? item.restaurants.name : 'Unknown Restaurant'}</Text>
                    </View>
                    <AntDesign name="pluscircle" size={24} color={theme.accent} />
                </View>
                </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.noResultsText, { color: theme.subText }]}>No dishes found with these filters.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  scrollContent: { paddingBottom: 20 },
  topBar: { paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 15, borderRadius: 30, borderWidth: 1, paddingHorizontal: 15, height: 50, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 16 },
  filterScroll: { paddingLeft: 20, marginBottom: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  filterText: { fontFamily: 'montserrat_medium', fontSize: 13 },
  pageTitle: { fontFamily: 'montserrat_bold', fontSize: 18, marginHorizontal: 20, marginBottom: 15, marginTop: 5 },
  listContainer: { paddingHorizontal: 20 },
  card: { borderRadius: 20, marginBottom: 20, elevation: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: 150 },
  cardContent: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoColumn: { flex: 1 },
  itemName: { fontFamily: 'montserrat_bold', fontSize: 18 },
  badgeRow: { flexDirection: 'row', marginTop: 5 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  categoryLabel: { fontSize: 12, fontFamily: 'montserrat_medium' },
  priceText: { fontFamily: 'montserrat_bold', fontSize: 16, marginTop: 5 },
  restaurantNameLabel: { fontSize: 12, marginTop: 4, fontStyle: 'italic', fontFamily: 'montserrat_regular' },
  noResultsText: { textAlign: 'center', marginTop: 40, fontFamily: 'montserrat_regular' }
});
export default Search;