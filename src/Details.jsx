import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, Dimensions, ImageBackground, StatusBar, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';

const { width } = Dimensions.get('window');

const Details = ({ navigation, route }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { restaurant, autoSelectItem } = route.params || {};

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [searchText, setSearchText] = useState('');
  const [activeVarietyFilter, setActiveVarietyFilter] = useState('All');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const checkIfOpen = () => {
    if (!restaurant) return { isOpen: false, reason: 'LOADING' };
    if (restaurant.is_open === false) return { isOpen: false, reason: 'MANUAL' };

    if (!restaurant.open_time || !restaurant.close_time) return { isOpen: true, reason: 'NO_TIME_SET' };

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = restaurant.open_time.split(':').map(Number);
    const [closeH, closeM] = restaurant.close_time.split(':').map(Number);

    const openMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;

    let isOpenTime = false;
    if (closeMins < openMins) {
      isOpenTime = currentMins >= openMins || currentMins <= closeMins;
    } else {
      isOpenTime = currentMins >= openMins && currentMins <= closeMins;
    }

    return { isOpen: isOpenTime, reason: isOpenTime ? 'OPEN' : 'TIME' };
  };

  const status = checkIfOpen();
  const isOpen = status.isOpen;

  useEffect(() => { if (restaurant?.id) { fetchMenu(restaurant.id); } }, [restaurant]);

  useEffect(() => {
    if (autoSelectItem && autoSelectItem.id) {
      setSelectedItems((prev) => ({ ...prev, [autoSelectItem.id]: true }));
    }
  }, [autoSelectItem]);

  const fetchMenu = async (restaurantId) => {
    try {
      const { data, error } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId);
      if (error) throw error;
      setMenuItems(data ? data.filter(item => item.is_deleted !== true) : []);
    } catch (error) { console.error(error.message); } finally { setLoading(false); }
  };

  const getMarkupPrice = (price) => Math.ceil(parseFloat(price || 0) * 1.20);

  const filterItems = () => menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) &&
    (activeVarietyFilter === 'All' || item.variety === activeVarietyFilter)
  );

  const groupedItems = filterItems().reduce((acc, item) => {
    const section = item.course || 'Others';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const courseSections = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Others'];

  const toggleItem = (id) => {
    if (!isOpen) {
      const msg = status.reason === 'MANUAL' ? "This restaurant is currently not accepting orders." : `Operating hours are ${restaurant.open_time} to ${restaurant.close_time}.`;
      return showAlert("Store Closed", msg);
    }
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCheckout = () => {
    if (!isOpen) return showAlert("Store Closed", "You cannot place an order while the store is closed.");

    const itemsToBuy = menuItems.filter(item => selectedItems[item.id]).map(item => ({
      ...item,
      restaurantName: restaurant?.name || 'General Order'
    }));

    if (itemsToBuy.length === 0) return showAlert("Empty", "Select items.");
    navigation.navigate('Checkout', { items: itemsToBuy });
  };

  const showAlert = (title, message) => { setAlertConfig({ title, message, buttons: [{ text: 'OK' }] }); setAlertVisible(true); };

  // CHANGE: Replaced the spinning circle with a structural Skeleton Loader
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
         <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
         <View style={[styles.skeletonBlock, { height: 220, width: '100%', backgroundColor: theme.border, borderRadius: 0 }]} />
         <View style={{ padding: 20 }}>
            <View style={[styles.skeletonBlock, { height: 30, width: 250, backgroundColor: theme.border, marginBottom: 10 }]} />
            <View style={[styles.skeletonBlock, { height: 20, width: 150, backgroundColor: theme.border, marginBottom: 20 }]} />
            <View style={[styles.skeletonBlock, { height: 50, width: '100%', backgroundColor: theme.card, borderRadius: 25, borderColor: theme.border, borderWidth: 1, marginBottom: 30 }]} />
            
            <View style={[styles.skeletonBlock, { height: 25, width: 120, backgroundColor: theme.border, marginBottom: 15 }]} />
            {[1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 20, height: 130 }}>
                <View style={{ flex: 1, paddingRight: 15 }}>
                   <View style={[styles.skeletonBlock, { height: 20, width: '80%', backgroundColor: theme.border, marginBottom: 10 }]} />
                   <View style={[styles.skeletonBlock, { height: 20, width: '40%', backgroundColor: theme.border, marginBottom: 15 }]} />
                   <View style={[styles.skeletonBlock, { height: 15, width: '100%', backgroundColor: theme.border }]} />
                </View>
                <View style={[styles.skeletonBlock, { height: 130, width: 130, backgroundColor: theme.border, borderRadius: 16 }]} />
              </View>
            ))}
         </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
            <Text style={[styles.modalMessage, { color: theme.subText }]}>{alertConfig.message}</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={() => setAlertVisible(false)}>
              <Text style={{ color: theme.accentText, fontFamily: 'montserrat_bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{ uri: restaurant?.image_url }} style={styles.headerImage}>
          {/* CHANGE: Added dark gradient overlay to make back button always visible */}
          <View style={styles.headerOverlay}>
            <SafeAreaView>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <AntDesign name="arrowleft" size={24} color="#000" />
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </ImageBackground>

        <View style={styles.infoSection}>
          <Text style={[styles.restaurantName, { color: theme.text }]}>{restaurant?.name}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-sharp" size={16} color={theme.subText} />
            <Text style={[styles.detailText, { color: theme.subText }]}>{restaurant?.location}</Text>
          </View>
          {!isOpen && (
            <View style={{ marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fee2e2', borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#fca5a5' }}>
              <Text style={{ color: '#ef4444', fontFamily: 'montserrat_bold', fontSize: 12 }}>Currently Closed</Text>
            </View>
          )}
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <AntDesign name="search1" size={20} color={theme.subText} />
          <TextInput placeholder="Search menu..." placeholderTextColor={theme.subText} style={[styles.searchInput, { color: theme.text }]} onChangeText={setSearchText} />
        </View>

        <View style={styles.menuList}>
          {courseSections.map((section) => {
            const itemsInSec = groupedItems[section] || [];
            if (itemsInSec.length === 0) return null;

            return (
              <View key={section} style={{ marginBottom: 25 }}>
                <Text style={[styles.sectionHeader, { color: theme.text }]}>{section}</Text>
                
                {itemsInSec.map((item) => {
                   const dietColor = item.is_veg ? '#0f8a46' : '#e23744';
                   const isSelected = selectedItems[item.id];
                   
                   return (
                    // CHANGE: Swapped from a row wrapper to a column wrapper with an absolute image on the right
                    <View key={item.id} style={[styles.modernMenuCard, { borderBottomColor: theme.border }]}>
                      
                      <View style={styles.modernMenuContent}>
                        {/* Veg/Non-Veg Indicator */}
                        <View style={[styles.vegIconBorder, { borderColor: dietColor }]}>
                          <View style={[styles.vegIconDot, { backgroundColor: dietColor, borderRadius: item.is_veg ? 2 : 50 }]} />
                        </View>
                        
                        <Text style={[styles.modernMenuTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                        <Text style={[styles.modernMenuPrice, { color: theme.text }]}>₹{getMarkupPrice(item.price)}</Text>
                        
                        {!!item.variety && <Text style={[styles.modernVarietyTag, { color: theme.subText }]}>{item.variety}</Text>}
                        
                        <Text style={[styles.modernMenuDesc, { color: theme.subText }]} numberOfLines={2}>
                           Delicious {item.name.toLowerCase()} prepared fresh by {restaurant?.name || 'our chefs'}.
                        </Text>
                      </View>

                      <View style={styles.modernMenuImageContainer}>
                        <Image source={{ uri: item.image_url }} style={styles.modernMenuImage} />
                        
                        {/* CHANGE: Added floating "ADD" button over the image like Swiggy/Zomato */}
                        {item.is_available ? (
                          <TouchableOpacity 
                            style={[styles.floatingAddBtn, { backgroundColor: isSelected ? theme.accent : theme.card, borderColor: theme.border }]} 
                            onPress={() => toggleItem(item.id)}
                          >
                            <Text style={[styles.floatingAddText, { color: isSelected ? '#FFF' : theme.accent }]}>
                              {isSelected ? 'ADDED' : 'ADD +'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.floatingAddBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <Text style={[styles.floatingAddText, { color: theme.subText }]}>OUT</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {Object.keys(selectedItems).some(k => selectedItems[k]) && (
        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={[styles.checkoutBtn, { backgroundColor: isOpen ? theme.accent : theme.border }]}
            onPress={handleCheckout}
            activeOpacity={isOpen ? 0.7 : 1}
          >
            <Text style={{ color: '#FFF', fontFamily: 'montserrat_bold', fontSize: 16, letterSpacing: 1 }}>{isOpen ? 'PROCEED TO CHECKOUT' : 'STORE CLOSED'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  headerImage: { height: 220, width: '100%' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  backBtn: { margin: 20, marginTop: Platform.OS === 'android' ? 40 : 20, width: 45, height: 45, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  infoSection: { padding: 20, paddingTop: 25 },
  restaurantName: { fontFamily: 'montserrat_bold', fontSize: 26, marginBottom: 5 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginLeft: 6, fontSize: 13, fontFamily: 'montserrat_medium' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, height: 50, elevation: 1, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'montserrat_regular' },
  menuList: { paddingHorizontal: 20, marginTop: 15 },
  
  // CHANGE: Styled the section headers to be cleaner
  sectionHeader: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 15, letterSpacing: 0.5 },
  
  // CHANGE: Completely redesigned Menu Card Layout (Image on Right, Text on Left)
  modernMenuCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 25, borderBottomWidth: 1 },
  modernMenuContent: { flex: 1, paddingRight: 20, justifyContent: 'flex-start' },
  
  vegIconBorder: { width: 14, height: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', borderRadius: 2, marginBottom: 6 },
  vegIconDot: { width: 6, height: 6 },
  
  modernMenuTitle: { fontFamily: 'montserrat_bold', fontSize: 16, marginBottom: 4 },
  modernMenuPrice: { fontFamily: 'montserrat_bold', fontSize: 15, marginBottom: 4 },
  modernVarietyTag: { fontFamily: 'montserrat_medium', fontSize: 11, marginBottom: 8 },
  modernMenuDesc: { fontFamily: 'montserrat_regular', fontSize: 12, lineHeight: 18 },
  
  modernMenuImageContainer: { width: 130, height: 130, position: 'relative', borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  modernMenuImage: { width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' },
  
  // CHANGE: Floating Add Button over the image
  floatingAddBtn: { position: 'absolute', bottom: -12, alignSelf: 'center', width: 90, height: 36, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, left: '15%' },
  floatingAddText: { fontFamily: 'montserrat_bold', fontSize: 14 },
  
  bottomBtnContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  checkoutBtn: { height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontFamily: 'montserrat_bold', fontSize: 18, marginBottom: 10 },
  modalMessage: { fontFamily: 'montserrat_regular', textAlign: 'center', marginBottom: 20 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },

  skeletonBlock: { borderRadius: 8 }
});

export default Details;