import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, Dimensions, ImageBackground, StatusBar, ActivityIndicator, Modal } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';

const Details = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { restaurant } = route.params || {};

  const [menuItems, setMenuItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [searchText, setSearchText] = useState('');
  const [activeVarietyFilter, setActiveVarietyFilter] = useState('All');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const checkIfOpen = () => { return { isOpen: true, reason: 'TIME', closingIn: null }; };
  const status = checkIfOpen(); 
  const isOpen = status.isOpen;

  useEffect(() => { if (restaurant?.id) { fetchMenu(restaurant.id); } }, [restaurant]);

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
    if (!isOpen) return showAlert("Closed", "Currently closed."); 
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] })); 
  };

  const handleCheckout = () => { 
    // PASS THE RAW DATA. Let Checkout.jsx handle the markup and commission math.
    // We also attach the restaurantName here so your n8n webhook gets it perfectly.
    const itemsToBuy = menuItems.filter(item => selectedItems[item.id]).map(item => ({ 
        ...item, 
        restaurantName: restaurant?.name || 'General Order'
    })); 
    
    if (itemsToBuy.length === 0) return showAlert("Empty", "Select items."); 
    navigation.navigate('Checkout', { items: itemsToBuy }); 
  };

  const showAlert = (title, message) => { setAlertConfig({ title, message, buttons: [{ text: 'OK' }] }); setAlertVisible(true); };

  if (loading) return <View style={[styles.center, {backgroundColor: theme.bg}]}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Alert Modal */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
                <Text style={[styles.modalMessage, { color: theme.subText }]}>{alertConfig.message}</Text>
                <TouchableOpacity style={[styles.modalBtn, {backgroundColor: theme.accent}]} onPress={() => setAlertVisible(false)}>
                    <Text style={{color: theme.accentText}}>OK</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{uri: restaurant?.image_url}} style={styles.headerImage}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <AntDesign name="arrowleft" size={24} color="#000" />
            </TouchableOpacity>
        </ImageBackground>

        <View style={styles.infoSection}>
          <Text style={[styles.restaurantName, { color: theme.text }]}>{restaurant?.name}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-sharp" size={16} color={theme.subText} />
            <Text style={[styles.detailText, { color: theme.text }]}>{restaurant?.location}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <AntDesign name="search1" size={20} color={theme.subText} />
          <TextInput placeholder="Search menu..." placeholderTextColor={theme.subText} style={[styles.searchInput, { color: theme.text }]} onChangeText={setSearchText} />
        </View>

        {/* Menu Items */}
        <View style={styles.menuList}>
          {courseSections.map((section) => {
            const itemsInSec = groupedItems[section] || [];
            if (itemsInSec.length === 0) return null; // Use NULL, not 0

            return (
              <View key={section} style={{marginBottom: 20}}>
                <Text style={[styles.sectionHeader, { color: theme.text, borderBottomColor: theme.border }]}>{section}</Text>
                {itemsInSec.map((item) => (
                  <View key={item.id} style={[styles.menuCard, { backgroundColor: theme.card }]}>
                    <Image source={{ uri: item.image_url }} style={styles.menuImage} />
                    <View style={styles.menuContent}>
                      <Text style={[styles.menuTitle, { color: theme.text }]}>{item.name}</Text>
                      <View style={{flexDirection: 'row', alignItems:'center'}}>
                         <Text style={[styles.menuPrice, { color: theme.text }]}>₹{getMarkupPrice(item.price)}</Text>
                         {/* FIX: Double bang ensures boolean check */}
                         {!!item.variety && <Text style={[styles.varietyTag, { color: theme.subText }]}> • {item.variety}</Text>}
                      </View>
                    </View>
                    {item.is_available && (
                      <TouchableOpacity onPress={() => toggleItem(item.id)}>
                        <MaterialCommunityIcons 
                          name={selectedItems[item.id] ? "checkbox-marked" : "checkbox-blank-outline"} 
                          size={28} 
                          color={selectedItems[item.id] ? theme.accent : theme.subText} 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBtnContainer}>
        <TouchableOpacity 
           style={[styles.checkoutBtn, { backgroundColor: isOpen ? theme.accent : theme.border }]} 
           onPress={handleCheckout}
        >
          <Text style={{ color: theme.accentText, fontWeight: 'bold' }}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  headerImage: { height: 200, width: '100%' },
  backBtn: { margin: 40, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: 20 },
  restaurantName: { fontSize: 26, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  detailText: { marginLeft: 10, fontSize: 14 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 25, borderWidth: 1, paddingHorizontal: 15, height: 45 },
  searchInput: { flex: 1, marginLeft: 10 },
  menuList: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 5 },
  menuCard: { flexDirection: 'row', borderRadius: 20, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 2 },
  menuImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500' },
  menuPrice: { fontSize: 16, fontWeight: 'bold' },
  varietyTag: { fontSize: 12 },
  bottomBtnContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  checkoutBtn: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { textAlign: 'center', marginBottom: 20 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 }
});

export default Details;