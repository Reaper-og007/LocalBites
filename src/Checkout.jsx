import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, Modal } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from './context/ThemeContext';

const Checkout = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  /* ... Keep your exact logic ... */
  const { items } = route.params || {}; const [cartItems, setCartItems] = useState([]); const [subtotal, setSubtotal] = useState(0); const deliveryFee = 19.00; 
  const [alertVisible, setAlertVisible] = useState(false); const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => { setAlertConfig({ title, message, buttons }); setAlertVisible(true); };

  useEffect(() => { if (items && items.length > 0) { const formattedItems = items.map(item => { let priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString().replace(/[^0-9.]/g, '')); return { ...item, quantity: 1, numericPrice: priceNum }; }); setCartItems(formattedItems); } else { setCartItems([]); } }, [items]);
  useEffect(() => { let total = 0; cartItems.forEach(item => { total += item.numericPrice * item.quantity; }); setSubtotal(total); }, [cartItems]);

  const incrementQty = (id) => setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decrementQty = (id) => setCartItems(prev => prev.map(item => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));
  const removeItem = (id) => setCartItems(prev => prev.filter(item => item.id !== id));
  const handleProceed = () => { if (cartItems.length === 0) return showAlert("Cart Empty", "Please add some items first!"); navigation.navigate('Contact', { cartData: cartItems, billTotal: subtotal }); };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Your checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listContainer}>
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <View key={item.id} style={[styles.cartCard, { backgroundColor: theme.card }]}>
                <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                  <View style={[styles.quantityContainer, { backgroundColor: theme.bg }]}>
                    <TouchableOpacity onPress={() => decrementQty(item.id)} style={styles.qtyBtn}><Text style={[styles.qtyText, { color: theme.text }]}>-</Text></TouchableOpacity>
                    <Text style={[styles.qtyNumber, { color: theme.text }]}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => incrementQty(item.id)} style={styles.qtyBtn}><Text style={[styles.qtyText, { color: theme.text }]}>+</Text></TouchableOpacity>
                  </View>
                </View>
                <View style={styles.rightAction}>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.danger} />
                  </TouchableOpacity>
                  <Text style={[styles.itemPrice, { color: theme.text }]}>₹{(item.numericPrice * item.quantity).toFixed(0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyCartText, { color: theme.subText }]}>No items in cart.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footerContainer, { backgroundColor: theme.card }]}>
        <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.subText }]}>Subtotal</Text><Text style={[styles.summaryValue, { color: theme.text }]}>₹{subtotal.toFixed(2)}</Text></View>
        <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.subText }]}>Est. Delivery</Text><Text style={[styles.summaryValue, { color: theme.text }]}>₹{deliveryFee.toFixed(2)}</Text></View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryRow}><Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text><Text style={[styles.totalValue, { color: theme.text }]}>₹{cartItems.length > 0 ? (subtotal + deliveryFee).toFixed(2) : '0.00'}</Text></View>
        <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: theme.accent }]} onPress={handleProceed}>
            <Text style={[styles.checkoutBtnText, { color: theme.accentText }]}>Proceed to Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 }, scrollContent: { paddingBottom: 20 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }, backButton: { marginRight: 15 }, headerTitle: { fontFamily: 'montserrat_bold', fontSize: 24 }, listContainer: { paddingHorizontal: 20 }, cartCard: { flexDirection: 'row', borderRadius: 20, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 3 }, itemImage: { width: 70, height: 70, borderRadius: 15, marginRight: 15 }, itemDetails: { flex: 1, justifyContent: 'center' }, itemName: { fontFamily: 'montserrat_medium', fontSize: 16, marginBottom: 10 }, quantityContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10, width: 100, justifyContent: 'space-between', elevation: 1 }, qtyBtn: { paddingHorizontal: 5 }, qtyText: { fontSize: 18, fontWeight: 'bold' }, qtyNumber: { fontFamily: 'montserrat_bold', fontSize: 14 }, rightAction: { alignItems: 'flex-end', justifyContent: 'space-between', height: 60 }, itemPrice: { fontFamily: 'montserrat_bold', fontSize: 16 }, emptyCartText: { textAlign: 'center', fontFamily: 'montserrat_regular', fontSize: 16, marginTop: 20 }, footerContainer: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 10, marginTop: 'auto' }, summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, summaryLabel: { fontFamily: 'montserrat_regular', fontSize: 16 }, summaryValue: { fontFamily: 'montserrat_bold', fontSize: 16 }, divider: { height: 1, marginVertical: 10 }, totalLabel: { fontFamily: 'montserrat_bold', fontSize: 20 }, totalValue: { fontFamily: 'montserrat_bold', fontSize: 20 }, checkoutButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 }, checkoutBtnText: { fontFamily: 'montserrat_bold', fontSize: 16 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, modalContainer: { width: '80%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 }, modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 10, textAlign: 'center' }, modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 25, textAlign: 'center' }, modalButtonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' }, modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, minWidth: 100, alignItems: 'center' },
});
export default Checkout;