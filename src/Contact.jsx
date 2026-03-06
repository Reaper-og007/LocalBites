import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';

const Contact = ({ navigation, route }) => {
  const { cartData, billTotal } = route.params || {};
  
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userLandmark, setUserLandmark] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('town');
  const [isSaving, setIsSaving] = useState(false);

  const businessNumber = "918390838652"; 
  const deliveryFee = deliveryZone === 'town' ? 30 : 80;
  const finalTotal = (billTotal || 0) + deliveryFee;

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setUserPhone(cleaned);
    }
  };

  const getRestaurantImage = () => {
    if (cartData && cartData.length > 0) {
      const item = cartData[0];
      const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
      if (restaurant && restaurant.image_url) {
        return restaurant.image_url;
      }
    }
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  };

  const restaurantImage = getRestaurantImage();

  const handlePlaceOrder = () => {
    if (!cartData || cartData.length === 0) {
        showAlert("Error", "No items to order!");
        return;
    }
    
    if (!userName.trim() || !userAddress.trim() || !userPhone.trim()) {
        showAlert("Missing Details", "Please fill in Name, Address, and Phone Number.");
        return;
    }

    if (userPhone.length !== 10) {
        showAlert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
        return;
    }

    const firstDigit = userPhone.charAt(0);
    if (['6','7','8','9'].indexOf(firstDigit) === -1) {
        showAlert("Invalid Phone", "Please enter a valid mobile number starting with 6, 7, 8, or 9.");
        return;
    }

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
    setAlertVisible(false);
    setIsSaving(true);

    const orderPayload = {
      userName: userName,
      userPhone: userPhone,
      userAddress: userLandmark.trim() 
        ? `${userAddress} (Landmark: ${userLandmark})` 
        : userAddress,
      deliveryZone: deliveryZone === 'town' ? 'Chopda Town' : 'Nearby Village',
      orderList: `[REST: ${restaurantName.toUpperCase()}] ` + cartData.map(i => `${i.name} x${i.quantity}`).join(', '),
      billTotal: finalTotal,
      itemsTotal: billTotal
    };

    fetch('https://n8n-eodb.onrender.com/webhook/order-received', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    })
    .then(() => {
        setIsSaving(false);
        showAlert(
            "Order Placed! 🎉", 
            "We have received your order. We will contact you shortly to confirm.",
            [{ text: "OK", onPress: () => navigation.popToTop() }]
        );
    })
    .catch(err => {
        setIsSaving(false);
        console.log("n8n Error:", err);
        showAlert("Network Error", "Could not place order automatically. Please use WhatsApp.");
    });
  };

  const openWhatsAppSupport = () => {
    const message = `Hi! I need help with my order`;
    Linking.openURL(`whatsapp://send?phone=${businessNumber}&text=${encodeURIComponent(message)}`);
  };

  return (
    <SafeAreaView style={styles.container}>
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
                                if (btn.text !== "Yes" && btn.text !== "OK") setAlertVisible(false); 
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <AntDesign name="arrowleft" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Details</Text> 
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: restaurantImage }} style={styles.featureImage} />
        </View>

        <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            
            <TextInput 
                placeholder="Your Name" 
                placeholderTextColor="#888" 
                style={styles.input} 
                value={userName}
                onChangeText={setUserName}
            />
            
            <TextInput 
                placeholder="Phone Number (10 digits)" 
                placeholderTextColor="#888" 
                keyboardType="number-pad"
                maxLength={10}
                style={styles.input} 
                value={userPhone}
                onChangeText={handlePhoneChange}
            />

            <TextInput 
                placeholder="Full Address (Hostel/Room No)" 
                placeholderTextColor="#888" 
                style={styles.input} 
                value={userAddress}
                onChangeText={setUserAddress}
                multiline
            />

            <TextInput 
                placeholder="Nearby Landmark (e.g. Near Water Tank)" 
                placeholderTextColor="#888" 
                style={styles.input} 
                value={userLandmark}
                onChangeText={setUserLandmark}
            />

            <Text style={styles.subTitle}>Select Delivery Zone:</Text>
            
            <TouchableOpacity 
              onPress={() => setDeliveryZone('town')}
              style={[styles.radioOption, deliveryZone === 'town' && styles.radioActive]}
            >
              <View style={[styles.radioCircle, deliveryZone === 'town' && styles.circleActive]}>
                {deliveryZone === 'town' && <View style={styles.innerCircle} />}
              </View>
              <Text style={styles.radioText}>Chopda Town (₹30)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setDeliveryZone('village')}
              style={[styles.radioOption, deliveryZone === 'village' && styles.radioActive]}
            >
               <View style={[styles.radioCircle, deliveryZone === 'village' && styles.circleActive]}>
                {deliveryZone === 'village' && <View style={styles.innerCircle} />}
              </View>
              <Text style={styles.radioText}>Nearby Village (₹80)</Text>
            </TouchableOpacity>

            <View style={styles.billSummary}>
              <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Item Total:</Text>
                 <Text style={styles.billValue}>₹{billTotal}</Text>
              </View>
              <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Delivery Fee:</Text>
                 <Text style={styles.billValue}>₹{deliveryFee}</Text>
              </View>
              <View style={[styles.billRow, styles.totalRow]}>
                 <Text style={styles.totalLabel}>To Pay:</Text>
                 <Text style={styles.totalValue}>₹{finalTotal}</Text>
              </View>
            </View>
        </View>

        <View style={styles.policyContainer}>
            <Text style={styles.policyTitle}>Cancellation Policy:</Text>
            <Text style={styles.policyText}>
                • Order cancelling will have <Text style={{fontWeight:'bold'}}>30% fees</Text> of items ordered if cancelled after 2 minutes.
                {'\n'}• Cancellation must be done via <Text style={{fontWeight:'bold'}}>WhatsApp or Call</Text>.
            </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.placeOrderButton, isSaving && {opacity: 0.7}]} 
            onPress={handlePlaceOrder}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.placeOrderText}>PLACE YOUR ORDER</Text>}
          </TouchableOpacity>

          <Text style={styles.subTitleCenter}>OR</Text>

          <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsAppSupport}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.whatsappText}>Contact Us / Order via WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.contactTitle}>Our Location</Text>
          <View style={styles.locationRow}>
            <Entypo name="location-pin" size={24} color="#000" />
            <Text style={styles.locationText}>Golmandir, Main Rd, Chopda, Maharashtra 425107</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { marginRight: 15 },
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 24, color: '#000' },
  imageContainer: { paddingHorizontal: 20, marginBottom: 25 },
  featureImage: { width: '100%', height: 180, borderRadius: 20, resizeMode: 'cover' },
  formContainer: { paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontFamily: 'montserrat_bold', fontSize: 20, color: '#000', marginBottom: 15 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, fontFamily: 'montserrat_regular', fontSize: 16, color: '#000', borderWidth: 1, borderColor: '#ccc' },
  buttonContainer: { paddingHorizontal: 20, marginBottom: 30 },
  subTitle: { fontFamily: 'montserrat_medium', fontSize: 16, color: '#666', marginBottom: 10, marginTop: 5 },
  subTitleCenter: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#AAA', textAlign: 'center', marginVertical: 10 },
  radioOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, marginBottom: 10, backgroundColor: '#fff' },
  radioActive: { borderColor: '#25D366', backgroundColor: '#e8f5e9' },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#888', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  circleActive: { borderColor: '#25D366' },
  innerCircle: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#25D366' },
  radioText: { fontFamily: 'montserrat_medium', fontSize: 16, color: '#000' },
  billSummary: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginTop: 10, marginBottom: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 8, marginTop: 5 },
  billLabel: { fontFamily: 'montserrat_regular', fontSize: 14, color: '#666' },
  billValue: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#000' },
  totalLabel: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#000' },
  totalValue: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#25D366' },
  policyContainer: { marginHorizontal: 20, marginBottom: 20, padding: 15, backgroundColor: '#FFF3E0', borderRadius: 12, borderWidth: 1, borderColor: '#FFCC80' },
  policyTitle: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#E65100', marginBottom: 5 },
  policyText: { fontFamily: 'montserrat_regular', fontSize: 12, color: '#BF360C', lineHeight: 18 },
  placeOrderButton: { backgroundColor: '#000', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  placeOrderText: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#FFF', letterSpacing: 1 },
  whatsappButton: { backgroundColor: '#25D366', height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  whatsappText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#FFF' },
  btnIcon: { marginRight: 10 },
  detailsContainer: { paddingHorizontal: 20 },
  contactTitle: { fontFamily: 'montserrat_bold', fontSize: 18, color: '#000', marginBottom: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontFamily: 'montserrat_regular', fontSize: 16, color: '#333', marginLeft: 8 },
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

export default Contact;