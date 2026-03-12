import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Modal, Linking, SafeAreaView } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from './context/ThemeContext';

const Contact = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
// Replace line 10 with this:
const { cartData, billTotal, chefNotes, restaurantName, platformCommission } = route.params || {};
  // Restored State
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userLandmark, setUserLandmark] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('town');
  const [isSaving, setIsSaving] = useState(false);

  const businessNumber = "918390838652";
  
  // Dynamic Delivery Fee Logic Restored
  const deliveryFee = deliveryZone === 'town' ? 19 : 69;
  const grandTotal = (billTotal || 0) + deliveryFee;

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const handlePhoneChange = (text) => { 
    const cleaned = text.replace(/[^0-9]/g, ''); 
    if (cleaned.length <= 10) setUserPhone(cleaned); 
  };

  const validateAndConfirm = () => {
    if (!cartData || cartData.length === 0) return showAlert("Error", "No items to order!");
    
    if (!userName.trim() || !userAddress.trim() || !userPhone.trim()) {
        return showAlert("Missing Details", "Please fill in Name, Address, and Phone Number.");
    }

    if (userPhone.length !== 10) {
        return showAlert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
    }

    const firstDigit = userPhone.charAt(0);
    if (['6','7','8','9'].indexOf(firstDigit) === -1) {
        return showAlert("Invalid Phone", "Please enter a valid mobile number starting with 6, 7, 8, or 9.");
    }

    // Confirmation Modal before triggering webhook
    showAlert(
      "Confirm Order",
      `Total Amount: ₹${grandTotal.toFixed(2)}\nPlace this order?`,
      [
        { text: "Cancel", onPress: () => setAlertVisible(false) },
        { text: "Yes", onPress: sendToAutomation }
      ]
    );
  };

const sendToAutomation = () => {
    setAlertVisible(false); 
    setIsSaving(true);
    
    let orderString = cartData.map((item, index) => 
      `${index + 1}. ${item.itemName} (Size: ${item.size} | Extras: ${item.addons}) - ₹${item.price}`
    ).join('\n');

    // The Ultimate Business Payload
    const orderPayload = { 
        userName, 
        userPhone, 
        userAddress: userLandmark.trim() ? `${userAddress} (Landmark: ${userLandmark})` : userAddress, 
        deliveryZone: deliveryZone === 'town' ? 'Chopda Town' : 'Nearby Village', 
        restaurantName: restaurantName, // SEPARATED
        orderList: orderString, 
        chefNotes: chefNotes !== 'None' ? chefNotes : 'None',
        itemsTotal: billTotal,          // SEPARATED (Customer Food Bill)
        deliveryFee: deliveryFee,       // SEPARATED (Driver Payout)
        grandTotal: grandTotal,         // SEPARATED (Total Collected)
        commission: platformCommission, // SEPARATED (Your Profit)
        timestamp: new Date().toISOString()
    };

    // Make sure you use /webhook-test/ first to teach n8n the new fields!
    fetch('https://n8n-eodb.onrender.com/webhook/order-received', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(orderPayload) 
    })
    // ... keep your existing .then() and .catch() blocks below this ...

    .then(() => { 
        setIsSaving(false); 
        showAlert("Order Placed! 🎉", "We have received your order. We will contact you shortly to confirm.", [
            { text: "Awesome", onPress: () => { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); } }
        ]); 
    })
    .catch(err => { 
        setIsSaving(false); 
        console.log("n8n Error:", err); 
        showAlert("Network Error", "Could not place order automatically. Please use WhatsApp."); 
    });
  };

  const openWhatsAppSupport = () => { 
    const message = `Hi! I need help with my order.`; 
    Linking.openURL(`whatsapp://send?phone=${businessNumber}&text=${encodeURIComponent(message)}`); 
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Alert Modal */}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Delivery Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Form Inputs */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
          <TextInput style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Your Name" placeholderTextColor={theme.subText} value={userName} onChangeText={setUserName} />

          <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number</Text>
          <TextInput style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="e.g. 8390838652" placeholderTextColor={theme.subText} keyboardType="numeric" maxLength={10} value={userPhone} onChangeText={handlePhoneChange} />

          <Text style={[styles.inputLabel, { color: theme.text }]}>Complete Address</Text>
          <TextInput style={[styles.inputField, styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="House No, Street, Landmark..." placeholderTextColor={theme.subText} multiline numberOfLines={3} value={userAddress} onChangeText={setUserAddress} />

          <Text style={[styles.inputLabel, { color: theme.text }]}>Nearby Landmark</Text>
          <TextInput style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="e.g. Near Water Tank" placeholderTextColor={theme.subText} value={userLandmark} onChangeText={setUserLandmark} />
        </View>

        {/* RESTORED: Delivery Zone Selector */}
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

         {/* NEW Order Summary Box */}
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

        {/* RESTORED: Cancellation Policy */}
        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>Cancellation Policy:</Text>
          <Text style={styles.policyText}>
            • Order cancelling will have <Text style={{ fontWeight: 'bold' }}>30% fees</Text> of items ordered if cancelled after 2 minutes.
            {'\n'}• Cancellation must be done via <Text style={{ fontWeight: 'bold' }}>WhatsApp or Call</Text>.
          </Text>
        </View>

        {/* RESTORED: WhatsApp Fallback */}
        <Text style={[styles.subTitleCenter, { color: theme.subText }]}>OR</Text>
        <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsAppSupport}>
          <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" style={styles.btnIcon} />
          <Text style={styles.whatsappText}>Contact Us / Order via WhatsApp</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* NEW Themed Submit Button Footer */}
      <View style={[styles.footerContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: isSaving ? theme.border : theme.accent }]} onPress={validateAndConfirm} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <Text style={[styles.submitBtnText, { color: theme.accentText }]}>Place Order • ₹{grandTotal.toFixed(2)}</Text>
          )}
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
  
  // Summary Styles
  summaryBox: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 25 },
  summaryTitle: { fontFamily: 'montserrat_bold', fontSize: 18, marginBottom: 15 },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryItemName: { fontFamily: 'montserrat_medium', fontSize: 16 },
  summaryItemDesc: { fontFamily: 'montserrat_regular', fontSize: 12, marginTop: 2 },
  summaryItemPrice: { fontFamily: 'montserrat_bold', fontSize: 16 },
  notesBox: { padding: 10, borderRadius: 8, marginTop: 10 },
  notesTitle: { fontFamily: 'montserrat_bold', fontSize: 12 },
  notesText: { fontFamily: 'montserrat_regular', fontSize: 12, marginTop: 4 },
  divider: { height: 1, marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontFamily: 'montserrat_bold', fontSize: 18 },
  totalAmount: { fontFamily: 'montserrat_bold', fontSize: 22 },

  // Input Styles
  inputSection: { marginBottom: 10 },
  inputLabel: { fontFamily: 'montserrat_medium', fontSize: 14, marginBottom: 8, marginLeft: 5 },
  inputField: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, height: 55, fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },

  // Radio Options
  subTitle: { fontFamily: 'montserrat_medium', fontSize: 16, marginBottom: 10, marginTop: 5 },
  radioOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderRadius: 12, marginBottom: 10 },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  innerCircle: { height: 10, width: 10, borderRadius: 5 },
  radioText: { fontFamily: 'montserrat_medium', fontSize: 16 },

  // Policy & WhatsApp
  policyContainer: { marginTop: 20, marginBottom: 15, padding: 15, backgroundColor: '#FFF3E0', borderRadius: 12, borderWidth: 1, borderColor: '#FFCC80' }, 
  policyTitle: { fontFamily: 'montserrat_bold', fontSize: 14, color: '#E65100', marginBottom: 5 }, 
  policyText: { fontFamily: 'montserrat_regular', fontSize: 12, color: '#BF360C', lineHeight: 18 },
  subTitleCenter: { fontFamily: 'montserrat_bold', fontSize: 14, textAlign: 'center', marginVertical: 15 }, 
  whatsappButton: { backgroundColor: '#25D366', height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2, marginBottom: 10 }, 
  whatsappText: { fontFamily: 'montserrat_bold', fontSize: 16, color: '#FFF' }, 
  btnIcon: { marginRight: 10 },

  // Footer
  footerContainer: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10 },
  submitButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontFamily: 'montserrat_bold', fontSize: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, 
  modalContainer: { width: '80%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 }, 
  modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 10, textAlign: 'center' }, 
  modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 25, textAlign: 'center' }, 
  modalButtonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' }, 
  modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, minWidth: 100, alignItems: 'center' },
  modalButtonText: { fontFamily: 'montserrat_bold', fontSize: 16 }
});

export default Contact;