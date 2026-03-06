import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Checkout = ({ navigation, route }) => {
  const { items } = route.params || {};
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  
  const deliveryFee = 30.00; 

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };
  // ---------------------------

  useEffect(() => {
    if (items && items.length > 0) {
      const formattedItems = items.map(item => {
        // Handle price robustly: 
        // Details.jsx sends a number now (markup price), but we ensure it works if string is passed too.
        let priceNum = 0;
        if (typeof item.price === 'number') {
            priceNum = item.price;
        } else {
            priceNum = parseFloat(item.price.toString().replace(/[^0-9.]/g, ''));
        }

        return {
           ...item,
           quantity: 1,
           numericPrice: priceNum
        };
      });
      setCartItems(formattedItems);
    } else {
        setCartItems([]);
    }
  }, [items]);

  useEffect(() => {
    let total = 0;
    cartItems.forEach(item => {
      total += item.numericPrice * item.quantity;
    });
    setSubtotal(total);
  }, [cartItems]);

  const incrementQty = (id) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decrementQty = (id) => {
    setCartItems(prev => prev.map(item => 
      item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    ));
  };

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleProceed = () => {
    if (cartItems.length === 0) {
        showAlert("Cart Empty", "Please add some items first!");
        return;
    }

    navigation.navigate('Contact', { 
        cartData: cartItems, 
        billTotal: subtotal 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* --- CUSTOM ALERT MODAL --- */}
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.listContainer}>
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <View key={item.id} style={styles.cartCard}>
                
                {/* Ensure we use image_url properly */}
                <Image 
                    source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} 
                    style={styles.itemImage} 
                />
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={() => decrementQty(item.id)} style={styles.qtyBtn}>
                      <Text style={styles.qtyText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNumber}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => incrementQty(item.id)} style={styles.qtyBtn}>
                      <Text style={styles.qtyText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.rightAction}>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#888" />
                  </TouchableOpacity>
                  {/* Display total price for that row */}
                  <Text style={styles.itemPrice}>₹{(item.numericPrice * item.quantity).toFixed(0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCartText}>No items in cart.</Text>
          )}
        </View>

      </ScrollView>

      <View style={styles.footerContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Est. Delivery</Text>
          <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
              ₹{cartItems.length > 0 ? (subtotal + deliveryFee).toFixed(2) : '0.00'}
          </Text>
        </View>

        <TouchableOpacity 
            style={styles.checkoutButton} 
            onPress={handleProceed}
        >
            <Text style={styles.checkoutBtnText}>Proceed to Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 50,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontFamily: 'montserrat_bold',
    fontSize: 24,
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'montserrat_medium',
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: 100,
    justifyContent: 'space-between',
    elevation: 1,
  },
  qtyBtn: {
    paddingHorizontal: 5,
  },
  qtyText: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  qtyNumber: {
    fontFamily: 'montserrat_bold',
    fontSize: 14,
    color: '#000',
  },
  rightAction: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  itemPrice: {
    fontFamily: 'montserrat_bold',
    fontSize: 16,
    color: '#000',
  },
  emptyCartText: {
    textAlign: 'center',
    fontFamily: 'montserrat_regular',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  footerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: 'auto', 
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: 'montserrat_regular',
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontFamily: 'montserrat_bold',
    fontSize: 16,
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 10,
  },
  totalLabel: {
    fontFamily: 'montserrat_bold',
    fontSize: 20,
    color: '#000',
  },
  totalValue: {
    fontFamily: 'montserrat_bold',
    fontSize: 20,
    color: '#000',
  },
  checkoutButton: {
    backgroundColor: '#82D428',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  checkoutBtnText: {
    fontFamily: 'montserrat_bold',
    fontSize: 16,
    color: '#000',
  },
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

export default Checkout;