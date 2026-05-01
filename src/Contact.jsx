import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Modal, Linking, SafeAreaView } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from './context/ThemeContext';
import { supabase } from './lib/supabase'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const Contact = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  
  // UI CHANGE: Force billTotal to Number immediately to prevent string math
  const params = route.params || {};
  const cartData = params.cartData || [];
  const billTotal = Number(params.billTotal || 0);
  const chefNotes = params.chefNotes || "None";
  const restaurantName = params.restaurantName || "LocalBites";
  const platformCommission = Number(params.platformCommission || 0);
  
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userLandmark, setUserLandmark] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('town');
  const [isSaving, setIsSaving] = useState(false);

  const [pricing, setPricing] = useState({ town: 19, village: 69, slashed: 49 });
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const businessNumber = "918390838652";
  
  // CHANGE: Calculate Automatic Discounts
  let autoDiscountPercentage = 0;
  if (billTotal >= 400) autoDiscountPercentage = 0.10; 
  else if (billTotal >= 200) autoDiscountPercentage = 0.05; 

  const autoDiscountAmount = billTotal * autoDiscountPercentage;

  // CHANGE: Calculate Free Delivery logic
  const isFreeDelivery = billTotal >= 500 && deliveryZone === 'town';
  const finalDeliveryFee = isFreeDelivery ? 0 : (deliveryZone === 'town' ? Number(pricing.town) : Number(pricing.village));

  const initialTotal = billTotal + finalDeliveryFee;
  const couponDiscountAmount = appliedCoupon ? (appliedCoupon.discount_type === 'percentage' ? (billTotal * (appliedCoupon.discount_value / 100)) : Number(appliedCoupon.discount_value)) : 0;
  
  const totalDiscountAmount = autoDiscountAmount + couponDiscountAmount;
  const grandTotal = Math.max(0, initialTotal - totalDiscountAmount);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  useEffect(() => {
    const initScreen = async () => {
      try {
        const savedProfileJson = await AsyncStorage.getItem('localbites_profile');
        if (savedProfileJson) {
          const profileData = JSON.parse(savedProfileJson);
          if (profileData.userName) setUserName(profileData.userName);
          if (profileData.userPhone) setUserPhone(profileData.userPhone);
          if (profileData.userAddress) setUserAddress(profileData.userAddress);
          if (profileData.userLandmark) setUserLandmark(profileData.userLandmark);
          if (profileData.deliveryZone) setDeliveryZone(profileData.deliveryZone);
        }
      } catch (err) { console.log("Profile load failed:", err); }

      try {
        const { data } = await supabase.from('delivery_config').select('*').single();
        if (data) setPricing({ town: data.delivery_fee_town, village: data.delivery_fee_village, slashed: data.delivery_fee_slashed });
      } catch (err) { console.log("Pricing load failed:", err); }
    };
    initScreen();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsVerifyingCoupon(true);
    const { data, error } = await supabase.from('coupons').select('*').eq('code', couponInput.toUpperCase().trim()).eq('is_active', true).single();
    setIsVerifyingCoupon(false);
    if (error || !data) return showAlert("Invalid Coupon", "Code does not exist or has expired.");
    if (billTotal < data.min_order_amount) return showAlert("Min Order Required", `Needs ₹${data.min_order_amount} minimum.`);
    setAppliedCoupon(data);
    showAlert("Success! 🎉", "Coupon applied!");
  };

  const handlePhoneChange = (text) => { 
    const cleaned = text.replace(/[^0-9]/g, ''); 
    if (cleaned.length <= 10) setUserPhone(cleaned); 
  };

  const validateAndConfirm = () => {
    if (!cartData || cartData.length === 0) return showAlert("Error", "No items!");
    if (!userName.trim() || !userAddress.trim() || !userPhone.trim()) return showAlert("Missing Details", "Please fill all fields.");
    if (userPhone.length !== 10) return showAlert("Invalid Phone", "Enter 10 digits.");
    showAlert("Confirm Order", `Total: ₹${grandTotal.toFixed(0)}\nPlace this order?`, [
      { text: "Cancel", onPress: () => setAlertVisible(false) },
      { text: "Yes", onPress: sendToAutomation }
    ]);
  };

 const sendToAutomation = async () => {
    setAlertVisible(false); 
    setIsSaving(true);
    
    let deviceId = 'unknown_device';
    try {
        if (typeof DeviceInfo.getUniqueId === 'function') {
            deviceId = await DeviceInfo.getUniqueId();
        } else {
            deviceId = userPhone;
        }
    } catch(e) { deviceId = userPhone; }
    
    let orderString = cartData.map((item, index) => 
      `${index + 1}. ${item.itemName} (Size: ${item.size} | Extras: ${item.addons}) - ₹${item.price}`
    ).join('\n');

    const profileToSave = { userName, userPhone, userAddress, userLandmark, deliveryZone };
    AsyncStorage.setItem('localbites_profile', JSON.stringify(profileToSave)).catch(err => console.log(err));
    
    // CHANGE: Fetch the FCM Token stored during app launch
    let fcmToken = 'NONE';
    try {
      const storedToken = await AsyncStorage.getItem('fcm_token');
      if (storedToken) fcmToken = storedToken;
    } catch (err) {
      console.log("FCM Token retrieval error:", err);
    }

    const safeBillTotal = Math.round(Number(billTotal) || 0);
    const safeDelivery = Math.round(Number(finalDeliveryFee) || 0);
    const safeDiscount = Math.round(Number(totalDiscountAmount) || 0);
    const safeGrandTotal = Math.round(Number(grandTotal) || 0);
    const safeCommission = Math.round(Number(platformCommission) || 0);

    const orderPayload = { 
        userId: String(deviceId), 
        userName: String(userName), 
        userPhone: String(userPhone), 
        userAddress: String(userLandmark.trim() ? `${userAddress} (Landmark: ${userLandmark})` : userAddress), 
        deliveryZone: String(deliveryZone === 'town' ? 'Chopda Town' : 'Nearby Village'), 
        restaurantName: String(restaurantName), 
        orderList: String(orderString), 
        chefNotes: String(chefNotes),
        itemsTotal: safeBillTotal,
        deliveryFee: safeDelivery,      
        couponCode: String(appliedCoupon?.code || (safeDiscount > 0 ? 'AUTO DISCOUNT' : 'NONE')),
        discountAmount: safeDiscount,            
        grandTotal: safeGrandTotal,        
        commission: safeCommission,
        // CHANGE: Successfully passing the token to the backend
        fcmToken: String(fcmToken) 
    };

    supabase.functions.invoke('process-order', { body: { orderPayload } })
      .then(({data, error}) => { 
        if(error) console.log("Edge Function Call Error:", error); 
        else console.log("Edge Function Response:", data);
      });

    setTimeout(() => {
        setIsSaving(false); 
        showAlert("Order Placed! 🎉", "Received! We will contact you shortly.", [
            { text: "Awesome", onPress: () => { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); } }
        ]); 
    }, 600); 
  };
  
  const openWhatsAppSupport = () => { Linking.openURL(`whatsapp://send?phone=${businessNumber}&text=Help!`); };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
                <Text style={[styles.modalMessage, { color: theme.subText }]}>{alertConfig.message}</Text>
                <View style={styles.modalButtonRow}>
                    {alertConfig.buttons.map((btn, index) => (
                        <TouchableOpacity key={index} style={[styles.modalButton, { backgroundColor: theme.border }, index > 0 && { backgroundColor: theme.accent, marginLeft: 15 }]} onPress={() => { if (btn.text !== "Yes" && btn.text !== "Awesome" && btn.text !== "OK") setAlertVisible(false); if (btn.onPress) btn.onPress(); }}>
                            <Text style={[styles.modalButtonText, { color: theme.text }, index > 0 && { color: theme.accentText }]}>{btn.text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
      </Modal>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><AntDesign name="arrowleft" size={28} color={theme.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Delivery Details</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
          <TextInput style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Your Name" placeholderTextColor={theme.subText} value={userName} onChangeText={setUserName} />
          <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number</Text>
          <TextInput style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="e.g. 8390838652" placeholderTextColor={theme.subText} keyboardType="numeric" maxLength={10} value={userPhone} onChangeText={handlePhoneChange} />
          <Text style={[styles.inputLabel, { color: theme.text }]}>Complete Address</Text>
          <TextInput style={[styles.inputField, styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="House No, Street..." placeholderTextColor={theme.subText} multiline value={userAddress} onChangeText={setUserAddress} />
          <Text style={[styles.inputLabel, { color: theme.text }]}>Nearby Landmark</Text>
          <TextInput style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="e.g. Near Water Tank" placeholderTextColor={theme.subText} value={userLandmark} onChangeText={setUserLandmark} />
        </View>
        <View style={[styles.couponContainer, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <TextInput style={[styles.couponInput, { color: theme.text }]} placeholder="Got a manual Coupon?" placeholderTextColor={theme.subText} autoCapitalize="characters" value={couponInput} onChangeText={setCouponInput} />
          <TouchableOpacity style={[styles.couponBtn, { backgroundColor: theme.accent }]} onPress={handleApplyCoupon} disabled={isVerifyingCoupon}>
            {isVerifyingCoupon ? <ActivityIndicator size="small" color="#FFF"/> : <Text style={styles.couponBtnText}>APPLY</Text>}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => setDeliveryZone('town')} style={[styles.radioOption, { backgroundColor: theme.card, borderColor: deliveryZone === 'town' ? theme.accent : theme.border }]}>
          <View style={[styles.radioCircle, { borderColor: deliveryZone === 'town' ? theme.accent : theme.subText }]}>{deliveryZone === 'town' && <View style={[styles.innerCircle, { backgroundColor: theme.accent }]} />}</View>
          <Text style={[styles.radioText, { color: theme.text }]}>Chopda {isFreeDelivery ? '(FREE)' : `(₹${pricing.town})`}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeliveryZone('village')} style={[styles.radioOption, { backgroundColor: theme.card, borderColor: deliveryZone === 'village' ? theme.accent : theme.border }]}>
          <View style={[styles.radioCircle, { borderColor: deliveryZone === 'village' ? theme.accent : theme.subText }]}>{deliveryZone === 'village' && <View style={[styles.innerCircle, { backgroundColor: theme.accent }]} />}</View>
          <Text style={[styles.radioText, { color: theme.text }]}>Nearby Village (₹{pricing.village})</Text>
        </TouchableOpacity>
        
        <View style={[styles.summaryBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Order Summary</Text>
          
          {cartData?.map((item, index) => (
            <View key={index} style={styles.summaryItemRow}>
              <View style={{flex: 1}}>
                <Text style={[styles.summaryItemName, { color: theme.text }]}>{item.itemName}</Text>
                <Text style={[styles.summaryItemDesc, { color: theme.subText }]}>Size: {item.size}</Text>
                {item.addons !== 'None' && <Text style={[styles.summaryItemDesc, { color: theme.subText }]}>Extras: {item.addons}</Text>}
              </View>
              <Text style={[styles.summaryItemPrice, { color: theme.text }]}>₹{item.price}</Text>
            </View>
          ))}
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.summaryItemRow}>
            <Text style={[styles.summaryItemName, { color: theme.text }]}>Delivery Fee</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isFreeDelivery && <Text style={{ textDecorationLine: 'line-through', color: theme.subText, marginRight: 6, fontSize: 13 }}>₹{pricing.town}</Text>}
              <Text style={[styles.summaryItemPrice, { color: isFreeDelivery ? theme.accent : theme.text }]}>{isFreeDelivery ? 'FREE' : `₹${finalDeliveryFee}`}</Text>
            </View>
          </View>

          {autoDiscountAmount > 0 && (
            <View style={styles.summaryItemRow}>
              <Text style={[styles.summaryItemName, { color: theme.accent }]}>Auto-Savings ({autoDiscountPercentage * 100}% OFF)</Text>
              <Text style={[styles.summaryItemPrice, { color: theme.accent }]}>-₹{autoDiscountAmount.toFixed(2)}</Text>
            </View>
          )}

          {appliedCoupon && (
            <View style={styles.summaryItemRow}>
              <Text style={[styles.summaryItemName, { color: theme.accent }]}>Coupon ({appliedCoupon.code})</Text>
              <Text style={[styles.summaryItemPrice, { color: theme.accent }]}>-₹{couponDiscountAmount.toFixed(2)}</Text>
            </View>
          )}
          
          {chefNotes !== 'None' && (
             <View style={[styles.notesBox, { backgroundColor: theme.bg }]}>
               <Text style={[styles.notesTitle, { color: theme.text }]}>Chef Notes:</Text>
               <Text style={[styles.notesText, { color: theme.subText }]}>{chefNotes}</Text>
             </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalText, { color: theme.text }]}>Grand Total</Text>
            <Text style={[styles.totalAmount, { color: theme.accent }]}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>Cancellation Policy:</Text>
          <Text style={styles.policyText}>
            • Order cancelling will have <Text style={{ fontWeight: 'bold' }}>30% fees</Text> of items ordered if cancelled after 2 minutes.
            {'\n'}• Cancellation must be done via <Text style={{ fontWeight: 'bold' }}>WhatsApp or Call</Text>.
          </Text>
        </View>

        <Text style={[styles.subTitleCenter, { color: theme.subText }]}>OR</Text>
        <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsAppSupport}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.whatsappText}>Contact Us / Order via WhatsApp</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={[styles.footerContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: isSaving ? theme.border : theme.accent }]} onPress={validateAndConfirm} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={theme.text} /> : <Text style={[styles.submitBtnText, { color: theme.accentText }]}>Place Order • ₹{grandTotal.toFixed(0)}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { marginRight: 15 },
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 24 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryBox: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 25, marginTop: 10 },
  summaryTitle: { fontFamily: 'montserrat_bold', fontSize: 18, marginBottom: 15 },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryItemName: { fontFamily: 'montserrat_medium', fontSize: 15 },
  summaryItemDesc: { fontFamily: 'montserrat_regular', fontSize: 12, marginTop: 2 },
  summaryItemPrice: { fontFamily: 'montserrat_bold', fontSize: 15 },
  divider: { height: 1, marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontFamily: 'montserrat_bold', fontSize: 18 },
  totalAmount: { fontFamily: 'montserrat_bold', fontSize: 22 },
  notesBox: { padding: 10, borderRadius: 8, marginTop: 10 },
  notesTitle: { fontFamily: 'montserrat_bold', fontSize: 12 },
  notesText: { fontFamily: 'montserrat_regular', fontSize: 12, marginTop: 4 },
  policyContainer: { marginBottom: 15, padding: 15, backgroundColor: '#FFF3E0', borderRadius: 12, borderWidth: 1, borderColor: '#FFCC80' }, 
  policyTitle: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#E65100', marginBottom: 5 }, 
  policyText: { fontFamily: 'montserrat_regular', fontSize: 12, color: '#BF360C', lineHeight: 18 },
  subTitleCenter: { fontFamily: 'montserrat_bold', fontSize: 14, textAlign: 'center', marginVertical: 15 }, 
  inputSection: { marginBottom: 10 },
  inputLabel: { fontFamily: 'montserrat_medium', fontSize: 14, marginBottom: 8, marginLeft: 5 },
  inputField: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, height: 55, fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
  radioOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderRadius: 12, marginBottom: 10 },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  innerCircle: { height: 10, width: 10, borderRadius: 5 },
  radioText: { fontFamily: 'montserrat_medium', fontSize: 16 },
  whatsappButton: { backgroundColor: '#25D366', height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }, 
  whatsappText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#FFF' }, 
  btnIcon: { marginRight: 10 },
  footerContainer: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10 },
  submitButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontFamily: 'montserrat_bold', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, 
  modalContainer: { width: '80%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 }, 
  modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 10, textAlign: 'center' }, 
  modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 25, textAlign: 'center' }, 
  modalButtonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' }, 
  modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, minWidth: 100, alignItems: 'center' },
  modalButtonText: { fontFamily: 'montserrat_bold', fontSize: 16 },
  couponContainer: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  couponInput: { flex: 1, paddingHorizontal: 15, fontFamily: 'montserrat_regular', fontSize: 16 },
  couponBtn: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  couponBtnText: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#FFF' }
});

export default Contact;