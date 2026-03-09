import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, Dimensions, ImageBackground, StatusBar, ActivityIndicator, Modal } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';

const Details = ({ navigation, route }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  /* ... Keep your exact same state and logic functions (checkIfOpen, formatTime, fetchMenu, etc.) ... */
  const { restaurant } = route.params || {};
  const checkIfOpen = () => { /* ... */ const isOpenTime = true; return { isOpen: isOpenTime, reason: 'TIME', closingIn: null }; }; // Placeholder for your logic
  const status = checkIfOpen(); const isOpen = status.isOpen;
  const formatTime = (timeStr) => { /* ... */ return timeStr; };
  const [menuItems, setMenuItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [searchText, setSearchText] = useState('');
  const [activeVarietyFilter, setActiveVarietyFilter] = useState('All');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => { setAlertConfig({ title, message, buttons }); setAlertVisible(true); };

  useEffect(() => { if (restaurant?.id) { fetchMenu(restaurant.id); } }, [restaurant]);
  const fetchMenu = async (restaurantId) => { try { const { data, error } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId); if (error) throw error; setMenuItems(data ? data.filter(item => item.is_deleted !== true) : []); } catch (error) { console.error(error.message); } finally { setLoading(false); } };

  const name = restaurant?.name || 'Restaurant'; const location = restaurant?.location || 'Location'; const imageSource = restaurant?.image_url ? { uri: restaurant.image_url } : null; const isVeg = restaurant?.is_veg ?? true;
  const getMarkupPrice = (originalPrice) => { const price = parseFloat(originalPrice); if (isNaN(price)) return 0; return Math.ceil(price * 1.20); };
  
  const filterItems = () => menuItems.filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase()) && (activeVarietyFilter === 'All' || item.variety === activeVarietyFilter));
  const groupedItems = filterItems().reduce((acc, item) => { const section = item.course || 'Others'; if (!acc[section]) acc[section] = []; acc[section].push(item); return acc; }, {});
  const courseSections = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Others'];

  const toggleItem = (id) => { if (!isOpen) return showAlert("Restaurant Closed", "Currently closed."); const item = menuItems.find(i => i.id === id); if (!item?.is_available) return showAlert("Unavailable", "Sold out."); setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] })); };
  const handleCheckout = () => { if (!isOpen) return showAlert("Closed", "Cannot order."); const itemsToBuy = menuItems.filter(item => selectedItems[item.id]).map(item => ({ ...item, quantity: 1, restaurantName: name, price: getMarkupPrice(item.price) })); if (itemsToBuy.length === 0) return showAlert("Empty", "Select items."); navigation.navigate('Checkout', { items: itemsToBuy }); };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}><ActivityIndicator size="large" color={theme.accent} /></View>;

  const getStatusBadge = () => { if (!isOpen) return { color: theme.danger, text: 'CLOSED' }; if (status.closingIn) return { color: '#FF9800', text: `CLOSING IN ${status.closingIn} MIN` }; return { color: theme.accent, text: 'OPEN' }; };
  const badgeInfo = getStatusBadge();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Modals inherit theme manually to prevent jarring white flashes */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
                <Text style={[styles.modalMessage, { color: theme.subText }]}>{alertConfig.message}</Text>
                <View style={styles.modalButtonRow}>
                    {alertConfig.buttons.map((btn, index) => (
                        <TouchableOpacity key={index} style={[styles.modalButton, { backgroundColor: theme.border }, index > 0 && { backgroundColor: theme.accent, marginLeft: 15 }]} onPress={() => { setAlertVisible(false); if (btn.onPress) btn.onPress(); }}>
                            <Text style={[styles.modalButtonText, { color: theme.text }, index > 0 && { color: theme.accentText }]}>{btn.text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <ImageBackground source={imageSource} style={styles.headerImage}>
            <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)'}} />
            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                <AntDesign name="arrowleft" size={24} color="#000" />
              </TouchableOpacity>
              <View style={[styles.statusBadge, { backgroundColor: badgeInfo.color }]}>
                  <Text style={[styles.statusText, { color: isOpen ? theme.accentText : '#FFF' }]}>{badgeInfo.text}</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={[styles.infoSection, { backgroundColor: theme.bg }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.restaurantName, { color: theme.text }]}>{name}</Text>
            <View style={styles.vegBadgeContainer}>
                <View style={[styles.vegIconBorder, { borderColor: isVeg ? '#82D428' : theme.danger }]}>
                    <View style={[styles.vegIconDot, { backgroundColor: isVeg ? '#82D428' : theme.danger, borderRadius: isVeg ? 4 : 50 }]} />
                </View>
                <Text style={[styles.vegText, { color: isVeg ? '#82D428' : theme.danger }]}>{isVeg ? 'VEG' : 'NON-VEG'}</Text>
            </View>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.detailRow}><Ionicons name="location-sharp" size={16} color={theme.subText} /><Text style={[styles.detailText, { color: theme.text }]}>{location}</Text></View>
            <View style={styles.detailRow}><MaterialCommunityIcons name="clock-time-four" size={16} color={theme.subText} /><Text style={[styles.detailText, { color: theme.text }]}>{restaurant?.open_time ? `${formatTime(restaurant.open_time)} - ${formatTime(restaurant.close_time)}` : '10:00 AM - 11:00 PM'}</Text></View>
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <AntDesign name="search1" size={20} color={theme.subText} style={styles.searchIcon} />
          <TextInput placeholder="Search menu..." placeholderTextColor={theme.subText} style={[styles.searchInput, { color: theme.text }]} value={searchText} onChangeText={setSearchText} />
        </View>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
             {['All', 'North Indian', 'South Indian', 'Chinese', 'Italian'].map((chip, index) => (
                <TouchableOpacity key={index} style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, activeVarietyFilter === chip && { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => setActiveVarietyFilter(chip)}>
                    <Text style={[styles.chipText, { color: theme.text }, activeVarietyFilter === chip && { color: theme.accentText }]}>{chip}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        <View style={styles.menuList}>
           {Object.keys(groupedItems).length === 0 ? (
               <Text style={[styles.noResultText, { color: theme.subText }]}>No items matching your search.</Text>
           ) : (
             courseSections.filter(section => groupedItems[section] && groupedItems[section].length > 0).map((section) => (
               <View key={section} style={{marginBottom: 20}}>
                   <Text style={[styles.sectionHeader, { color: theme.text, borderBottomColor: theme.border }]}>{section}</Text>
                   {groupedItems[section].map((item) => (
                        <View key={item.id} style={[styles.menuCard, { backgroundColor: theme.card }, (!item.is_available || !isOpen) && { opacity: 0.6 }]}>
                            <Image source={{ uri: item.image_url }} style={styles.menuImage} />
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, { color: theme.text }]}>{item.name}</Text>
                                <Text style={[styles.menuDesc, { color: theme.subText }]} numberOfLines={2}>{item.description}</Text>
                                <View style={{flexDirection: 'row', alignItems:'center'}}>
                                     <Text style={[styles.menuPrice, { color: theme.text }]}>₹{getMarkupPrice(item.price)}</Text>
                                     {item.variety && <Text style={[styles.varietyTag, { color: theme.subText }]}> • {item.variety}</Text>}
                                </View>
                                {!item.is_available && <Text style={{color: theme.danger, fontSize: 12, fontWeight:'bold'}}>Sold Out</Text>}
                            </View>
                            {item.is_available && (
                                <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkboxContainer} activeOpacity={isOpen ? 0.7 : 1}>
                                    <MaterialCommunityIcons 
                                    name={selectedItems[item.id] ? "checkbox-marked" : "checkbox-blank-outline"} 
                                    size={28} 
                                    color={!isOpen ? theme.border : (selectedItems[item.id] ? theme.accent : theme.subText)} 
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
        <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: isOpen ? theme.accent : theme.border }]} onPress={handleCheckout} disabled={!isOpen}>
            <Text style={[styles.checkoutText, { color: isOpen ? theme.accentText : theme.subText }]}>{isOpen ? 'Proceed to Checkout' : 'Restaurant Closed'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, scrollContent: { paddingBottom: 100 }, headerContainer: { height: 250, width: '100%' }, headerImage: { width: '100%', height: '100%', resizeMode: 'cover' }, headerIcons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, paddingHorizontal: 20 }, iconButton: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }, statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, justifyContent: 'center', alignItems: 'center', minWidth: 80 }, statusText: { fontFamily: 'montserrat_bold', fontSize: 12 }, infoSection: { padding: 20 }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }, restaurantName: { fontFamily: 'montserrat_bold', fontSize: 26, flex: 1 }, vegBadgeContainer: { alignItems: 'center' }, vegIconBorder: { width: 24, height: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }, vegIconDot: { width: 12, height: 12 }, vegText: { fontFamily: 'montserrat_bold', fontSize: 10, marginTop: 2 }, detailsList: { gap: 5 }, detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 }, detailText: { fontFamily: 'montserrat_regular', fontSize: 13, marginLeft: 10 }, searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 30, borderWidth: 1, paddingHorizontal: 15, height: 50, marginTop: 10 }, searchIcon: { marginRight: 10 }, searchInput: { flex: 1, fontFamily: 'montserrat_regular', fontSize: 16 }, filterSection: { paddingHorizontal: 20, marginTop: 15 }, chipsScroll: { flexDirection: 'row' }, chip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, elevation: 2 }, chipText: { fontFamily: 'montserrat_medium', fontSize: 13 }, menuList: { paddingHorizontal: 20, marginTop: 25 }, sectionHeader: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 15, borderBottomWidth: 1, paddingBottom: 5 }, menuCard: { flexDirection: 'row', borderRadius: 20, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 3 }, menuImage: { width: 70, height: 70, borderRadius: 35, marginRight: 15 }, menuContent: { flex: 1 }, menuTitle: { fontFamily: 'montserrat_medium', fontSize: 16, marginBottom: 4 }, menuDesc: { fontFamily: 'montserrat_regular', fontSize: 12, marginBottom: 8, lineHeight: 16 }, menuPrice: { fontFamily: 'montserrat_bold', fontSize: 16 }, varietyTag: { fontFamily: 'montserrat_regular', fontSize: 12 }, checkboxContainer: { padding: 5 }, bottomButtonContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 }, checkoutButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 5 }, checkoutText: { fontFamily: 'montserrat_bold', fontSize: 16 }, noResultText: { fontFamily: 'montserrat_regular', fontSize: 14, textAlign: 'center', marginTop: 20 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, modalContainer: { width: '80%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 }, modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 10, textAlign: 'center' }, modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 25, textAlign: 'center' }, modalButtonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' }, modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, minWidth: 100, alignItems: 'center' }, modalButtonText: { fontFamily: 'montserrat_bold', fontSize: 16 },
});
export default Details;