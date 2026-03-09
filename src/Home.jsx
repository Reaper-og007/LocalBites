import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, ActivityIndicator, Alert, Linking } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';

const { width } = Dimensions.get('window');
const CURRENT_VERSION_CODE = 2; // Updated for your new release

const Home = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkUpdate(); fetchRestaurants(); }, []);

  const checkUpdate = async () => { /* ... Keep your existing update logic ... */ };
  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase.from('restaurants').select('*');
      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) { console.error(error.message); } finally { setLoading(false); }
  };

  const bigFeature = restaurants[0];
  const quickBites = restaurants.slice(1);
  const categories = [{ name: 'Italian', icon: 'pizza' }, { name: 'Chinese', icon: 'noodles' }, { name: 'North Indian', icon: 'food-variant' }, { name: 'South Indian', icon: 'rice' }, { name: 'Fast Food', icon: 'hamburger' }];

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>WELCOME</Text>
          {/* THE DARK MODE TOGGLE */}
          <TouchableOpacity onPress={toggleTheme}>
            <Feather name={isDarkMode ? "sun" : "moon"} size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.7} onPress={() => navigation.navigate('Search')}>
          <AntDesign name="search1" size={20} color={theme.subText} style={styles.searchIcon} />
          <TextInput placeholder="Search" placeholderTextColor={theme.subText} style={[styles.searchInput, { color: theme.text }]} editable={false} pointerEvents="none" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>Top local restaurants</Text></View>

        {bigFeature && (
          <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Details', { restaurant: bigFeature })}>
            <Image source={{ uri: bigFeature.image_url }} style={styles.bigCardImage} />
            <View style={styles.overlayContainer}><Text style={styles.exploreText}>Explore</Text></View>
            <View style={styles.bigCardContent}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{bigFeature.name}</Text>
              <Text style={[styles.cardSubtitle, { color: theme.subText }]}>{bigFeature.location}</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>Quick bites</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {quickBites.map((rest) => (
            <TouchableOpacity key={rest.id} style={[styles.smallCard, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Details', { restaurant: rest })}>
              <Image source={{ uri: rest.image_url }} style={styles.smallCardImage} />
              <View style={styles.smallCardContent}>
                <Text style={[styles.smallCardTitle, { color: theme.text }]}>{rest.name}</Text>
                <View style={[styles.vegIconBorder, { borderColor: rest.is_veg ? theme.accent : theme.danger }]}>
                  <View style={[styles.vegIconDot, { backgroundColor: rest.is_veg ? theme.accent : theme.danger, borderRadius: rest.is_veg ? 4 : 50 }]} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>Cuisine Categories</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 30 }}>
          {categories.map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <TouchableOpacity style={[styles.categoryBox, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Search', { categoryQuery: item.name })}>
                <MaterialCommunityIcons name={item.icon} size={32} color={theme.accentText} />
              </TouchableOpacity>
              <Text style={[styles.categoryText, { color: theme.text }]}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  scrollContent: { paddingBottom: 20 },
  header: { paddingHorizontal: 20, marginTop: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontFamily: 'montserrat_bold', fontSize: 36, letterSpacing: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 10, borderRadius: 30, borderWidth: 1, paddingHorizontal: 15, height: 50, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontFamily: 'montserrat_bold', fontSize: 18 },
  bigCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', elevation: 3, marginBottom: 5 },
  bigCardImage: { width: '100%', height: 180 },
  overlayContainer: { position: 'absolute', top: 15, left: 15, right: 15, flexDirection: 'row', justifyContent: 'flex-end' },
  exploreText: { color: 'white', fontFamily: 'montserrat_bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3, position: 'absolute', left: 0 },
  bigCardContent: { padding: 15 },
  cardTitle: { fontFamily: 'montserrat_bold', fontSize: 18 },
  cardSubtitle: { fontFamily: 'montserrat_regular', fontSize: 14, marginTop: 2 },
  horizontalScroll: { paddingLeft: 20 },
  smallCard: { width: width * 0.42, marginRight: 15, borderRadius: 15, marginBottom: 5, elevation: 2 },
  smallCardImage: { width: '100%', height: 120, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  smallCardContent: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  smallCardTitle: { fontFamily: 'montserrat_bold', fontSize: 14, flexShrink: 1, marginRight: 8 },
  vegIconBorder: { width: 14, height: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 3 },
  vegIconDot: { width: 6, height: 6 },
  categoryItem: { alignItems: 'center', marginRight: 20, width: 70 },
  categoryBox: { width: 65, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2 },
  categoryText: { fontFamily: 'montserrat_regular', fontSize: 12, marginTop: 2, textAlign: 'center' },
});
export default Home;