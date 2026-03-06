import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from './lib/supabase';

const { width } = Dimensions.get('window');

// --- PROFESSIONAL VERSIONING ---
// Match this number with 'versionCode' in android/app/build.gradle
const CURRENT_VERSION_CODE = 2; 

const Home = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUpdate();
    fetchRestaurants();
  }, []);

  const checkUpdate = async () => {
    try {
      const { data, error } = await supabase
        .from('app_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // LOGIC: If DB version code is higher than current app code, force update.
      // Assumes your DB has a 'min_version_code' column (Integer)
      if (data && data.min_version_code > CURRENT_VERSION_CODE) {
        Alert.alert(
          "Update Required",
          "A critical update is available. Please update to the latest version to continue using LocalBites.",
          [
            { 
              text: "Update Now", 
              onPress: () => Linking.openURL(data.url || 'https://play.google.com/store/apps/details?id=com.localbites') 
            }
          ],
          { cancelable: false } // Blocks the user from dismissing the alert
        );
      }
    } catch (err) {
      console.log("Update check failed", err);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const bigFeature = restaurants[0];
  const quickBites = restaurants.slice(1);

  const categories = [
    { name: 'Italian', icon: 'pizza' },
    { name: 'Chinese', icon: 'noodles' },
    { name: 'North Indian', icon: 'food-variant' },
    { name: 'South Indian', icon: 'rice' },
    { name: 'Fast Food', icon: 'hamburger' },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#82D428" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.welcomeText}>WELCOME</Text>
        </View>

        <TouchableOpacity style={styles.searchContainer} activeOpacity={0.7} onPress={() => navigation.navigate('Search')}>
          <AntDesign name="search1" size={20} color="#888" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search" 
            placeholderTextColor="#888" 
            style={styles.searchInput} 
            editable={false} 
            pointerEvents="none" 
          />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top local restaurants</Text>
        </View>

        {bigFeature && (
          <TouchableOpacity 
            style={styles.bigCard} 
            onPress={() => navigation.navigate('Details', { restaurant: bigFeature })}
          >
            <Image 
              source={{ uri: bigFeature.image_url }} 
              style={styles.bigCardImage} 
            />
            <View style={styles.overlayContainer}>
              <Text style={styles.exploreText}>Explore</Text>
            </View>
            <View style={styles.bigCardContent}>
              <Text style={styles.cardTitle}>{bigFeature.name}</Text>
              <Text style={styles.cardSubtitle}>{bigFeature.location}</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick bites</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {quickBites.map((rest) => (
            <TouchableOpacity 
              key={rest.id}
              style={styles.smallCard}
              onPress={() => navigation.navigate('Details', { restaurant: rest })}
            >
              <Image source={{ uri: rest.image_url }} style={styles.smallCardImage} />
              <View style={styles.smallCardContent}>
                <Text style={styles.smallCardTitle}>{rest.name}</Text>
                <View style={[styles.vegIconBorder, { borderColor: rest.is_veg ? 'green' : 'red' }]}>
                  <View style={[styles.vegIconDot, { backgroundColor: rest.is_veg ? 'green' : 'red', borderRadius: rest.is_veg ? 4 : 50 }]} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Cuisine Categories</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 30 }}>
          {categories.map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <TouchableOpacity 
                style={styles.categoryBox}
                onPress={() => navigation.navigate('Search', { categoryQuery: item.name })}
              >
                <MaterialCommunityIcons name={item.icon} size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 50 },
  scrollContent: { paddingBottom: 20 },
  header: { paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  welcomeText: { fontFamily: 'montserrat_bold', fontSize: 36, color: '#000', letterSpacing: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 10, borderRadius: 30, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 15, height: 50, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 16, color: '#000' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#000' },
  bigCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 3, marginBottom: 5 },
  bigCardImage: { width: '100%', height: 180 },
  overlayContainer: { position: 'absolute', top: 15, left: 15, right: 15, flexDirection: 'row', justifyContent: 'flex-end' },
  exploreText: { color: 'white', fontFamily: 'montserrat_bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3, position: 'absolute', left: 0 },
  bigCardContent: { padding: 15 },
  cardTitle: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#000' },
  cardSubtitle: { fontFamily: 'montserrat_regular', fontSize: 14, color: '#777', marginTop: 2 },
  horizontalScroll: { paddingLeft: 20 },
  smallCard: { width: width * 0.42, marginRight: 15, backgroundColor: '#fff', borderRadius: 15, marginBottom: 5, elevation: 2 },
  smallCardImage: { width: '100%', height: 120, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  smallCardContent: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallCardTitle: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#000', flex: 1 },
  vegIconBorder: { width: 16, height: 16, borderWidth: 1, borderColor: 'green', justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  vegIconDot: { width: 8, height: 8, backgroundColor: 'green', borderRadius: 4 },
  categoryItem: { alignItems: 'center', marginRight: 20, width: 70 },
  categoryBox: { width: 65, height: 65, borderRadius: 22, backgroundColor: '#82D428', justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2 },
  categoryText: { fontFamily: 'montserrat_regular', fontSize: 12, color: '#000', marginTop: 2, textAlign: 'center' },
});

export default Home;