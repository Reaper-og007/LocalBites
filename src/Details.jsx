import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  Modal
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from './lib/supabase';

const Details = ({ navigation, route }) => {
  const { restaurant } = route.params || {};

  // --- 1. HYBRID OPEN/CLOSE LOGIC ---
  const checkIfOpen = () => {
    const manualOpen = restaurant?.is_open ?? true;
    if (!manualOpen) return { isOpen: false, reason: 'MANUAL' };

    if (!restaurant?.open_time || !restaurant?.close_time) return { isOpen: true, reason: 'ALWAYS' };

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const parseToMins = (timeStr) => {
        const [h, m] = timeStr.split(':');
        return parseInt(h) * 60 + parseInt(m);
    };

    const openMins = parseToMins(restaurant.open_time);
    const closeMins = parseToMins(restaurant.close_time);

    const isOpenTime = currentMins >= openMins && currentMins < closeMins;
    
    let closingIn = null;
    if (isOpenTime && (closeMins - currentMins <= 30) && (closeMins - currentMins > 0)) {
        closingIn = closeMins - currentMins;
    }

    return { isOpen: isOpenTime, reason: 'TIME', closingIn };
  };

  const status = checkIfOpen();
  const isOpen = status.isOpen;

  // --- 2. TIME FORMATTER ---
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; 
    return `${formattedHour}:${m} ${ampm}`;
  };

  const [menuItems, setMenuItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [searchText, setSearchText] = useState('');
  const [activeCourseFilter, setActiveCourseFilter] = useState('All'); 
  const [activeVarietyFilter, setActiveVarietyFilter] = useState('All');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  useEffect(() => {
    if (restaurant?.id) {
        fetchMenu(restaurant.id);
    }
  }, [restaurant]);

  // Updated query to respect soft delete if implemented, otherwise standard fetch
  const fetchMenu = async (restaurantId) => {
    try {
        let query = supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId);
            
        // Check if is_deleted column exists before filtering (optional safety, but assuming you added it)
        // For now, we will just fetch all non-deleted items assuming the column exists
        // query = query.eq('is_deleted', false); 

        const { data, error } = await query;

        if (error) throw error;
        // Client-side filter for soft delete compatibility if column might be missing
        const validItems = data ? data.filter(item => item.is_deleted !== true) : [];
        setMenuItems(validItems);
    } catch (error) {
        console.error("Error loading menu:", error.message);
    } finally {
        setLoading(false);
    }
  };

  const name = restaurant?.name || 'Restaurant';
  const location = restaurant?.location || 'Location';
  const imageSource = restaurant?.image_url ? { uri: restaurant.image_url } : null;
  const isVeg = restaurant?.is_veg ?? true;

  const getMarkupPrice = (originalPrice) => {
    const price = parseFloat(originalPrice);
    if (isNaN(price)) return 0;
    return Math.ceil(price * 1.20);
  };

  const filterItems = () => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesCourse = activeCourseFilter === 'All' || item.course === activeCourseFilter;
      const matchesVariety = activeVarietyFilter === 'All' || item.variety === activeVarietyFilter;
      return matchesSearch && matchesCourse && matchesVariety;
    });
  };

  const groupedItems = filterItems().reduce((acc, item) => {
    const section = item.course || 'Others'; 
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const courseSections = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Others'];

  const toggleItem = (id) => {
    if (!isOpen) {
        showAlert("Restaurant Closed", "This restaurant is currently closed and not accepting orders.");
        return;
    }
    const item = menuItems.find(i => i.id === id);
    if (!item?.is_available) {
        showAlert("Unavailable", "This item is currently sold out.");
        return;
    }
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCheckout = () => {
    if (!isOpen) {
        showAlert("Restaurant Closed", "Sorry, you cannot place an order while the restaurant is closed.");
        return;
    }
    const itemsToBuy = menuItems
        .filter(item => selectedItems[item.id])
        .map(item => ({
            ...item,
            quantity: 1, 
            restaurantName: name,
            price: getMarkupPrice(item.price) 
        }));
    
    if (itemsToBuy.length === 0) {
        showAlert("Empty Cart", "Please select items to proceed.");
        return;
    }
    navigation.navigate('Checkout', { items: itemsToBuy });
  };

  if (loading) {
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#82D428" />
          </View>
      );
  }

  const getStatusBadge = () => {
      if (!isOpen) return { color: '#FF4444', text: 'CLOSED' };
      if (status.closingIn) return { color: '#FF9800', text: `CLOSING IN ${status.closingIn} MIN` };
      return { color: '#82D428', text: 'OPEN' };
  };

  const badgeInfo = getStatusBadge();

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{alertConfig.title}</Text>
                <Text style={styles.modalMessage}>{alertConfig.message}</Text>
                <View style={styles.modalButtonRow}>
                    {alertConfig.buttons.map((btn, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={[styles.modalButton, index > 0 && styles.modalButtonPrimary]} 
                            onPress={() => {
                                setAlertVisible(false);
                                if (btn.onPress) btn.onPress();
                            }}
                        >
                            <Text style={[styles.modalButtonText, index > 0 && styles.modalButtonTextPrimary]}>{btn.text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <ImageBackground source={imageSource} style={styles.headerImage}>
            <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)'}} />
            
            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                <AntDesign name="arrowleft" size={24} color="#000" />
              </TouchableOpacity>
              
              <View style={[styles.statusBadge, { backgroundColor: badgeInfo.color }]}>
                  <Text style={styles.statusText}>{badgeInfo.text}</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.restaurantName}>{name}</Text>
            <View style={styles.vegBadgeContainer}>
                <View style={[styles.vegIconBorder, { borderColor: isVeg ? 'green' : 'red' }]}>
                    <View style={[styles.vegIconDot, { backgroundColor: isVeg ? 'green' : 'red', borderRadius: isVeg ? 4 : 50 }]} />
                </View>
                <Text style={[styles.vegText, { color: isVeg ? 'green' : 'red' }]}>{isVeg ? 'VEG' : 'NON-VEG'}</Text>
            </View>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Ionicons name="location-sharp" size={16} color="#000" />
              <Text style={styles.detailText}>{location}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-time-four" size={16} color="#000" />
              <Text style={styles.detailText}>
                  {restaurant?.open_time ? 
                    `${formatTime(restaurant.open_time)} - ${formatTime(restaurant.close_time)}` 
                    : '10:00 AM - 11:00 PM'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <AntDesign name="search1" size={20} color="#555" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search menu..." 
            placeholderTextColor="#888" 
            style={styles.searchInput} 
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
             {['All', 'North Indian', 'South Indian', 'Chinese', 'Italian'].map((chip, index) => (
                <TouchableOpacity 
                    key={index} 
                    style={[styles.chip, activeVarietyFilter === chip && styles.activeChip]} 
                    onPress={() => setActiveVarietyFilter(chip)}
                >
                    <Text style={[styles.chipText, activeVarietyFilter === chip && styles.activeChipText]}>{chip}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        <View style={styles.menuList}>
           {Object.keys(groupedItems).length === 0 ? (
               <Text style={styles.noResultText}>No items matching your search.</Text>
           ) : (
             courseSections.filter(section => groupedItems[section] && groupedItems[section].length > 0).map((section) => (
               <View key={section} style={{marginBottom: 20}}>
                   <Text style={styles.sectionHeader}>{section}</Text>
                   
                   {groupedItems[section].map((item) => (
                        <View key={item.id} style={[styles.menuCard, (!item.is_available || !isOpen) && styles.disabledCard]}>
                            <Image source={{ uri: item.image_url }} style={[styles.menuImage, (!item.is_available || !isOpen) && { opacity: 0.5 }]} />
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.name}</Text>
                                <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
                                <View style={{flexDirection: 'row', alignItems:'center'}}>
                                     <Text style={styles.menuPrice}>₹{getMarkupPrice(item.price)}</Text>
                                     {item.variety && <Text style={styles.varietyTag}> • {item.variety}</Text>}
                                </View>
                                {!item.is_available && <Text style={{color: 'red', fontSize: 12, fontWeight:'bold'}}>Sold Out</Text>}
                            </View>
                            
                            {item.is_available && (
                                <TouchableOpacity 
                                    onPress={() => toggleItem(item.id)} 
                                    style={styles.checkboxContainer}
                                    activeOpacity={isOpen ? 0.7 : 1}
                                >
                                    <MaterialCommunityIcons 
                                    name={selectedItems[item.id] ? "checkbox-marked" : "checkbox-blank-outline"} 
                                    size={28} 
                                    color={!isOpen ? "#CCC" : (selectedItems[item.id] ? "#000" : "#888")} 
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                   ))}
               </View>
             ))
           )}
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
            style={[styles.checkoutButton, !isOpen && { backgroundColor: '#CCC' }]} 
            onPress={handleCheckout}
            disabled={!isOpen}
        >
            <Text style={styles.checkoutText}>
                {isOpen ? 'Proceed to Checkout' : 'Restaurant Closed'}
            </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingBottom: 100 },
  headerContainer: { height: 250, width: '100%' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerIcons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, paddingHorizontal: 20 },
  iconButton: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
  statusText: { fontFamily: 'montserrat_bold', fontSize: 12, color: '#FFF' },
  infoSection: { padding: 20, backgroundColor: '#FAFAFA' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  restaurantName: { fontFamily: 'montserrat_bold', fontSize: 26, color: '#000', flex: 1 },
  vegBadgeContainer: { alignItems: 'center' },
  vegIconBorder: { width: 24, height: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  vegIconDot: { width: 12, height: 12 },
  vegText: { fontFamily: 'montserrat_bold', fontSize: 10, marginTop: 2 },
  detailsList: { gap: 5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailText: { fontFamily: 'montserrat_regular', fontSize: 13, color: '#000', marginLeft: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 15, height: 50, marginTop: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 16, color: '#000' },
  filterSection: { paddingHorizontal: 20, marginTop: 15 },
  chipsScroll: { flexDirection: 'row' },
  chip: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  activeChip: { backgroundColor: '#82D428', borderColor: '#82D428' },
  chipText: { fontFamily: 'montserrat_medium', fontSize: 13, color: '#666' },
  activeChipText: { color: '#000', fontFamily: 'montserrat_bold' },
  menuList: { paddingHorizontal: 20, marginTop: 25 },
  sectionHeader: { fontFamily: 'montserrat_bold', fontSize: 20, color: '#000', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  menuCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 3 },
  disabledCard: { backgroundColor: '#f0f0f0', opacity: 0.8 }, 
  menuImage: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  menuContent: { flex: 1 },
  menuTitle: { fontFamily: 'montserrat_medium', fontSize: 16, color: '#000', marginBottom: 4 },
  menuDesc: { fontFamily: 'montserrat_regular', fontSize: 12, color: '#666', marginBottom: 8, lineHeight: 16 },
  menuPrice: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#6CC51D' },
  varietyTag: { fontFamily: 'montserrat_regular', fontSize: 12, color: '#888' },
  checkboxContainer: { padding: 5 },
  bottomButtonContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  checkoutButton: { backgroundColor: '#82D428', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  checkoutText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#000' },
  noResultText: { fontFamily: 'montserrat_regular', fontSize: 14, color: '#888', textAlign: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, color: '#000', marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, color: '#666', marginBottom: 25, textAlign: 'center' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
  modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, backgroundColor: '#f0f0f0', minWidth: 100, alignItems: 'center' },
  modalButtonPrimary: { backgroundColor: '#82D428', marginLeft: 15 },
  modalButtonText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#000' },
  modalButtonTextPrimary: { color: '#000' },
});

export default Details;