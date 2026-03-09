import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Linking, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ThemeContext } from './context/ThemeContext';

const Contact = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  /* ... Keep your exact logic ... */
  const { cartData, billTotal } = route.params || {};
  const [userName, setUserName] = useState(''); const [userAddress, setUserAddress] = useState(''); const [userLandmark, setUserLandmark] = useState(''); const [userPhone, setUserPhone] = useState(''); const [deliveryZone, setDeliveryZone] = useState('town'); const [isSaving, setIsSaving] = useState(false);
  const businessNumber = "918390838652"; const deliveryFee = deliveryZone === 'town' ? 19 : 69; const finalTotal = (billTotal || 0) + deliveryFee;
  const [alertVisible, setAlertVisible] = useState(false); const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => { setAlertConfig({ title, message, buttons }); setAlertVisible(true); };
  const handlePhoneChange = (text) => { const cleaned = text.replace(/[^0-9]/g, ''); if (cleaned.length <= 10) { setUserPhone(cleaned); } };
  const getRestaurantImage = () => { if (cartData && cartData.length > 0) { const item = cartData[0]; const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants; if (restaurant && restaurant.image_url) { return restaurant.image_url; } } return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; };
  const restaurantImage = getRestaurantImage();

const handlePlaceOrder = () => {
    // 1. Check if cart somehow emptied out
    if (!cartData || cartData.length === 0) {
        showAlert("Error", "No items to order!");
        return;
    }
    
    // 2. Check for empty fields
    if (!userName.trim() || !userAddress.trim() || !userPhone.trim()) {
        showAlert("Missing Details", "Please fill in Name, Address, and Phone Number.");
        return;
    }

    // 3. Enforce 10-digit phone number
    if (userPhone.length !== 10) {
        showAlert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
        return;
    }

    // 4. Enforce valid Indian mobile prefix (6, 7, 8, or 9)
    const firstDigit = userPhone.charAt(0);
    if (['6','7','8','9'].indexOf(firstDigit) === -1) {
        showAlert("Invalid Phone", "Please enter a valid mobile number starting with 6, 7, 8, or 9.");
        return;
    }

    // 5. If it passes all checks, show the confirmation modal
    showAlert(
      "Confirm Order",
      `Total Amount: ₹${finalTotal}\nPlace this order?`,
      [
        { text: "Cancel", onPress: () => setAlertVisible(false) },
        { text: "Yes", onPress: sendToAutomation }
      ]
    );
  };
    const restaurantName = cartData && cartData[0]?.restaurantName ? cartData[0].restaurantName : "General Order";

  const sendToAutomation = () => {
    setAlertVisible(false); setIsSaving(true);
    const orderPayload = { userName, userPhone, userAddress: userLandmark.trim() ? `${userAddress} (Landmark: ${userLandmark})` : userAddress, deliveryZone: deliveryZone === 'town' ? 'Chopda Town' : 'Nearby Village', orderList: `[REST: ${restaurantName.toUpperCase()}] ` + cartData.map(i => `${i.name} x${i.quantity}`).join(', '), billTotal: finalTotal, itemsTotal: billTotal };
    fetch('https://n8n-eodb.onrender.com/webhook/order-received', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) })
      .then(() => { setIsSaving(false); showAlert("Order Placed! 🎉", "We have received your order. We will contact you shortly to confirm.", [{ text: "OK", onPress: () => { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); } }]); })
      .catch(err => { setIsSaving(false); console.log("n8n Error:", err); showAlert("Network Error", "Could not place order automatically. Please use WhatsApp."); });
  };
  const openWhatsAppSupport = () => { const message = `Hi! I need help with my order`; Linking.openURL(`whatsapp://send?phone=${businessNumber}&text=${encodeURIComponent(message)}`); };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
            <Text style={[styles.modalMessage, { color: theme.subText }]}>{alertConfig.message}</Text>
            <View style={styles.modalButtonRow}>
              {alertConfig.buttons.map((btn, index) => (
                <TouchableOpacity key={index} style={[styles.modalButton, { backgroundColor: theme.border }, index > 0 && { backgroundColor: theme.accent, marginLeft: 15 }]} onPress={() => { if (btn.text !== "Yes" && btn.text !== "OK") setAlertVisible(false); if (btn.onPress) btn.onPress(); }}>
                  <Text style={[styles.modalButtonText, { color: theme.text }, index > 0 && { color: theme.accentText }]}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <AntDesign name="arrowleft" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Details</Text>
        </View>

        <View style={styles.imageContainer}><Image source={{ uri: restaurantImage }} style={styles.featureImage} /></View>

        <View style={styles.formContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Details</Text>

          <TextInput placeholder="Your Name" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} value={userName} onChangeText={setUserName} />
          <TextInput placeholder="Phone Number (10 digits)" placeholderTextColor={theme.subText} keyboardType="number-pad" maxLength={10} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} value={userPhone} onChangeText={handlePhoneChange} />
          <TextInput placeholder="Full Address (Hostel/Room No)" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} value={userAddress} onChangeText={setUserAddress} multiline />
          <TextInput placeholder="Nearby Landmark (e.g. Near Water Tank)" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} value={userLandmark} onChangeText={setUserLandmark} />

          <Text style={[styles.subTitle, { color: theme.subText }]}>Select Delivery Zone:</Text>

          <TouchableOpacity onPress={() => setDeliveryZone('town')} style={[styles.radioOption, { backgroundColor: theme.card, borderColor: deliveryZone === 'town' ? theme.accent : theme.border }]}>
            <View style={[styles.radioCircle, { borderColor: deliveryZone === 'town' ? theme.accent : theme.subText }]}>
              {deliveryZone === 'town' && <View style={[styles.innerCircle, { backgroundColor: theme.accent }]} />}
            </View>
            <Text style={[styles.radioText, { color: theme.text }]}>Chopda (₹19)</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setDeliveryZone('village')} style={[styles.radioOption, { backgroundColor: theme.card, borderColor: deliveryZone === 'village' ? theme.accent : theme.border }]}>
            <View style={[styles.radioCircle, { borderColor: deliveryZone === 'village' ? theme.accent : theme.subText }]}>
              {deliveryZone === 'village' && <View style={[styles.innerCircle, { backgroundColor: theme.accent }]} />}
            </View>
            <Text style={[styles.radioText, { color: theme.text }]}>Nearby Village/Town (₹69)</Text>
          </TouchableOpacity>

          <View style={[styles.billSummary, { backgroundColor: theme.card }]}>
            <View style={styles.billRow}><Text style={[styles.billLabel, { color: theme.subText }]}>Item Total:</Text><Text style={[styles.billValue, { color: theme.text }]}>₹{billTotal}</Text></View>
            <View style={styles.billRow}><Text style={[styles.billLabel, { color: theme.subText }]}>Delivery Fee:</Text><Text style={[styles.billValue, { color: theme.text }]}>₹{deliveryFee}</Text></View>
            <View style={[styles.billRow, styles.totalRow, { borderTopColor: theme.border }]}><Text style={[styles.totalLabel, { color: theme.text }]}>To Pay:</Text><Text style={[styles.totalValue, { color: theme.accent }]}>₹{finalTotal}</Text></View>
          </View>
        </View>

        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>Cancellation Policy:</Text>
          <Text style={styles.policyText}>
            • Order cancelling will have <Text style={{ fontWeight: 'bold' }}>30% fees</Text> of items ordered if cancelled after 2 minutes.
            {'\n'}• Cancellation must be done via <Text style={{ fontWeight: 'bold' }}>WhatsApp or Call</Text>.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.placeOrderButton, { backgroundColor: theme.text }, isSaving && { opacity: 0.7 }]} onPress={handlePlaceOrder} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={theme.bg} /> : <Text style={[styles.placeOrderText, { color: theme.bg }]}>PLACE YOUR ORDER</Text>}
          </TouchableOpacity>

          <Text style={[styles.subTitleCenter, { color: theme.subText }]}>OR</Text>

          {/* Note: WhatsApp button is kept branded green because it represents an external app */}
          <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsAppSupport}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.whatsappText}>Contact Us / Order via WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>Our Location</Text>
          <View style={styles.locationRow}>
            <Entypo name="location-pin" size={24} color={theme.danger} />
            <Text style={[styles.locationText, { color: theme.text }]}>Golmandir, Main Rd, Chopda, Maharashtra 425107</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 }, scrollContent: { paddingBottom: 40 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }, backButton: { marginRight: 15 }, headerTitle: { fontFamily: 'montserrat_bold', fontSize: 24 }, imageContainer: { paddingHorizontal: 20, marginBottom: 25 }, featureImage: { width: '100%', height: 180, borderRadius: 20, resizeMode: 'cover' }, formContainer: { paddingHorizontal: 20, marginBottom: 10 }, sectionTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 15 }, input: { padding: 15, borderRadius: 12, marginBottom: 15, fontFamily: 'montserrat_regular', fontSize: 16, borderWidth: 1 }, buttonContainer: { paddingHorizontal: 20, marginBottom: 30 }, subTitle: { fontFamily: 'montserrat_medium', fontSize: 16, marginBottom: 10, marginTop: 5 }, subTitleCenter: { fontFamily: 'montserrat_bold', fontSize: 14, textAlign: 'center', marginVertical: 10 }, radioOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderRadius: 12, marginBottom: 10 }, radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, innerCircle: { height: 10, width: 10, borderRadius: 5 }, radioText: { fontFamily: 'montserrat_medium', fontSize: 16 }, billSummary: { padding: 15, borderRadius: 12, marginTop: 10, marginBottom: 10 }, billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, totalRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 5 }, billLabel: { fontFamily: 'montserrat_regular', fontSize: 14 }, billValue: { fontFamily: 'montserrat_bold', fontSize: 14 }, totalLabel: { fontFamily: 'montserrat_bold', fontSize: 18 }, totalValue: { fontFamily: 'montserrat_bold', fontSize: 18 }, policyContainer: { marginHorizontal: 20, marginBottom: 20, padding: 15, backgroundColor: '#FFF3E0', borderRadius: 12, borderWidth: 1, borderColor: '#FFCC80' }, policyTitle: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#E65100', marginBottom: 5 }, policyText: { fontFamily: 'montserrat_regular', fontSize: 12, color: '#BF360C', lineHeight: 18 }, placeOrderButton: { height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3 }, placeOrderText: { fontFamily: 'montserrat_bold', fontSize: 18, letterSpacing: 1 }, whatsappButton: { backgroundColor: '#25D366', height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2 }, whatsappText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#FFF' }, btnIcon: { marginRight: 10 }, detailsContainer: { paddingHorizontal: 20 }, contactTitle: { fontFamily: 'montserrat_bold', fontSize: 18, marginBottom: 10 }, locationRow: { flexDirection: 'row', alignItems: 'center' }, locationText: { fontFamily: 'montserrat_regular', fontSize: 16, marginLeft: 8 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, modalContainer: { width: '80%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 }, modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 10, textAlign: 'center' }, modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 25, textAlign: 'center' }, modalButtonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' }, modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, minWidth: 100, alignItems: 'center' }, modalButtonText: { fontFamily: 'montserrat_bold', fontSize: 16 },
});
export default Contact;