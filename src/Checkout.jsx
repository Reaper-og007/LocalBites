import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput, ActivityIndicator } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from './lib/supabase';
import { ThemeContext } from './context/ThemeContext';

const Checkout = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { items } = route.params || {}; 
  
  const [cartInstances, setCartInstances] = useState([]); 
  const [availableOptions, setAvailableOptions] = useState([]); 
  const [chefNotes, setChefNotes] = useState(''); 
  const [subtotal, setSubtotal] = useState(0); 
  const [loadingOptions, setLoadingOptions] = useState(true);
  const deliveryFee = 19.00; 
  
  const [alertVisible, setAlertVisible] = useState(false); 
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => setAlertVisible(false) }]) => { setAlertConfig({ title, message, buttons }); setAlertVisible(true); };

  // Custom Size Modal State
  const [sizeModalConfig, setSizeModalConfig] = useState({ visible: false, instanceId: null, sizes: [] });

  // CHANGE: Dynamic Markup Function. Uses item's specific markup_percentage, defaults to 30% if undefined.
  // UI CHANGE: Added strict fallback (30) so the math never results in NaN
// LOGIC CHANGE: Match the Smart Markup Engine from Details.jsx
  const getMarkupPrice = (price, markup) => {
    const rawPrice = parseFloat(price || 0);
    let safeMarkup = (markup !== undefined && markup !== null) ? parseFloat(markup) : 30;

    // Overriding the default 30% for cheap items
    if (safeMarkup === 30 && rawPrice < 100) {
      safeMarkup = 20;
    }

    const calculated = Math.ceil(rawPrice * (1 + (safeMarkup / 100)));
    return isNaN(calculated) ? 0 : calculated;
  };

  useEffect(() => { 
    if (items && items.length > 0) { 
      fetchOptions(items.map(i => i.id));
    } else { 
      setCartInstances([]); 
      setLoadingOptions(false);
    } 
  }, [items]);

  const fetchOptions = async (itemIds) => {
    try {
      const { data, error } = await supabase
        .from('item_options')
        .select('*')
        .in('item_id', itemIds)
        .eq('is_available', true);
        
      if (error) throw error;
      setAvailableOptions(data || []);
      initializeCart(items, data || []);
    } catch (error) {
      console.error("Options Fetch Error:", error.message);
    } finally {
      setLoadingOptions(false);
    }
  };

  const initializeCart = (baseItems, optionsDb) => {
    const initialInstances = baseItems.map(item => createInstance(item, optionsDb));
    setCartInstances(initialInstances);
  };

  const createInstance = (baseItem, optionsDb) => {
    let priceNum = typeof baseItem.price === 'number' ? baseItem.price : parseFloat(baseItem.price.toString().replace(/[^0-9.]/g, ''));
    const itemOptions = optionsDb.filter(o => o.item_id === baseItem.id);
    const sizes = itemOptions.filter(o => o.option_type === 'SIZE');
    
    const defaultSize = sizes.find(s => s.name.toLowerCase() === 'regular') || sizes[0] || null;

    return {
      ...baseItem, 
      instanceId: `${baseItem.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
      numericPrice: priceNum,
      selectedSize: defaultSize,
      selectedToppings: [] 
    };
  };

  useEffect(() => { 
    let total = 0; 
    cartInstances.forEach(inst => { 
      let baseCost = inst.selectedSize ? inst.selectedSize.price_modifier : inst.numericPrice;
      // CHANGE: Pass the instance's specific markup_percentage to the dynamic calculator
      let instanceTotal = getMarkupPrice(baseCost, inst.markup_percentage);
      
      inst.selectedToppings.forEach(tId => {
        const toppingData = availableOptions.find(o => o.id === tId);
        if (toppingData) instanceTotal += toppingData.price_modifier;
      });
      total += instanceTotal; 
    }); 
    setSubtotal(total); 
  }, [cartInstances, availableOptions]);

  const addAnother = (baseItem) => setCartInstances(prev => [...prev, createInstance(baseItem, availableOptions)]);
  const removeInstance = (instanceId) => setCartInstances(prev => prev.filter(inst => inst.instanceId !== instanceId));
  const updateSize = (instanceId, sizeObj) => setCartInstances(prev => prev.map(inst => inst.instanceId === instanceId ? { ...inst, selectedSize: sizeObj } : inst));
  
  const toggleTopping = (instanceId, toppingObj) => {
    setCartInstances(prev => prev.map(inst => {
      if (inst.instanceId !== instanceId) return inst;
      const hasTopping = inst.selectedToppings.includes(toppingObj.id);
      return {
        ...inst,
        selectedToppings: hasTopping ? inst.selectedToppings.filter(id => id !== toppingObj.id) : [...inst.selectedToppings, toppingObj.id]
      };
    }));
  };

  const handleProceed = () => { 
    if (cartInstances.length === 0) return showAlert("Cart Empty", "Please add some items first!"); 
    
    let exactCommission = 0;
    const restaurantName = cartInstances[0]?.restaurantName || 'General Order';

    const formattedOrderList = cartInstances.map((inst) => {
      const sizeName = inst.selectedSize ? inst.selectedSize.name : 'Regular';
      const toppingNames = inst.selectedToppings.map(tId => {
        const t = availableOptions.find(o => o.id === tId);
        return t ? t.name : '';
      }).filter(Boolean).join(', ');

      let baseCost = inst.selectedSize ? inst.selectedSize.price_modifier : inst.numericPrice;
      // CHANGE: Applied dynamic markup calculation for the proceed payload
      let finalPrice = getMarkupPrice(baseCost, inst.markup_percentage);
      
      exactCommission += (finalPrice - baseCost);
      
      inst.selectedToppings.forEach(tId => {
        const tData = availableOptions.find(o => o.id === tId);
        if (tData) {
            // CHANGE: Apply dynamic markup to toppings if needed, defaulting to 30%
            const toppingMarkup = getMarkupPrice(tData.price_modifier, tData.markup_percentage || 30);
            finalPrice += toppingMarkup;
            exactCommission += (toppingMarkup - tData.price_modifier);
        }
      });

      return { itemName: inst.name, size: sizeName, addons: toppingNames || 'None', price: finalPrice };
    });

    navigation.navigate('Contact', { 
        cartData: formattedOrderList, 
        billTotal: subtotal, 
        chefNotes: chefNotes.trim() || "None",
        restaurantName: restaurantName,
        platformCommission: exactCommission
    }); 
  };

  // CHANGE: Gamification Logic - Calculate progress towards the next discount tier
  let nextTierMessage = '';
  let progressPercentage = 0;
  if (subtotal < 200) {
    nextTierMessage = `Add ₹${(200 - subtotal).toFixed(0)} more for 5% OFF!`;
    progressPercentage = (subtotal / 200) * 100;
  } else if (subtotal < 400) {
    nextTierMessage = `Add ₹${(400 - subtotal).toFixed(0)} more for 10% OFF!`;
    progressPercentage = ((subtotal - 200) / 200) * 100;
  } else if (subtotal < 500) {
    nextTierMessage = `Add ₹${(500 - subtotal).toFixed(0)} more for FREE Delivery (Chopda)!`;
    progressPercentage = ((subtotal - 400) / 100) * 100;
  } else {
    nextTierMessage = `🎉 You've unlocked maximum savings & Free Delivery!`;
    progressPercentage = 100;
  }

  if (loadingOptions) return <View style={[styles.container, {justifyContent: 'center', backgroundColor: theme.bg}]}><ActivityIndicator size="large" color={theme.accent}/></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <Modal visible={sizeModalConfig.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, width: '85%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 20 }]}>Select Size</Text>
            {sizeModalConfig.sizes.map(s => (
              <TouchableOpacity 
                key={s.id} 
                style={[styles.sizeOptionBtn, { borderBottomColor: theme.border }]}
                onPress={() => {
                  updateSize(sizeModalConfig.instanceId, s);
                  setSizeModalConfig({ visible: false, instanceId: null, sizes: [] });
                }}
              >
                <Text style={[styles.sizeOptionText, { color: theme.text }]}>{s.name}</Text>
                {/* CHANGE: Added dynamic markup to modal price display */}
                <Text style={[styles.sizeOptionPrice, { color: theme.text }]}>₹{getMarkupPrice(s.price_modifier, s.markup_percentage)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{marginTop: 20, padding: 10}} onPress={() => setSizeModalConfig({ visible: false, instanceId: null, sizes: [] })}>
              <Text style={{color: theme.danger, fontFamily: 'montserrat_bold', fontSize: 16}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* CHANGE: Progress Bar UI injected above the cart items */}
        {cartInstances.length > 0 && (
          <View style={[styles.progressContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.progressText, { color: theme.text }]}>{nextTierMessage}</Text>
            <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: theme.accent }]} />
            </View>
          </View>
        )}

        <View style={styles.listContainer}>
          {cartInstances.map((inst, index) => {
            const itemOptions = availableOptions.filter(o => o.item_id === inst.originalId || o.item_id === inst.id);
            const sizes = itemOptions.filter(o => o.option_type === 'SIZE');
            const toppings = itemOptions.filter(o => o.option_type === 'TOPPING');

            let baseCost = inst.selectedSize ? inst.selectedSize.price_modifier : inst.numericPrice;
            // CHANGE: Dynamic markup for individual cart card display
            let instTotal = getMarkupPrice(baseCost, inst.markup_percentage);
            inst.selectedToppings.forEach(tId => {
              const tData = availableOptions.find(o => o.id === tId);
              if (tData) instTotal += tData.price_modifier;
            });

            return (
              <View key={`${inst.instanceId}-${index}`} style={[styles.cartCard, { backgroundColor: theme.card }]}>
                <View style={styles.itemHeaderRow}>
                  <Image source={{ uri: inst.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{inst.name}</Text>
                    <Text style={[styles.itemPrice, { color: theme.text }]}>₹{instTotal.toFixed(0)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeInstance(inst.instanceId)} style={styles.removeBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.danger} />
                  </TouchableOpacity>
                </View>

                {sizes.length > 0 && (
                  <TouchableOpacity 
                    style={[styles.customPickerBtn, { borderColor: theme.border, backgroundColor: theme.bg }]}
                    onPress={() => setSizeModalConfig({ visible: true, instanceId: inst.instanceId, sizes: sizes })}
                  >
                    <Text style={[styles.customPickerText, { color: theme.text }]}>
                      {/* CHANGE: Dynamic markup for picker text */}
                      {inst.selectedSize ? `${inst.selectedSize.name} (₹${getMarkupPrice(inst.selectedSize.price_modifier, inst.selectedSize.markup_percentage)})` : 'Select Size'}
                    </Text>
                    <AntDesign name="down" size={16} color={theme.subText} />
                  </TouchableOpacity>
                )}

                {toppings.length > 0 && (
                  <View style={styles.toppingsContainer}>
                    <Text style={[styles.toppingsLabel, { color: theme.subText }]}>Add-ons:</Text>
                    <View style={styles.chipsWrapper}>
                      {toppings.map(t => {
                        const isSelected = inst.selectedToppings.includes(t.id);
                        return (
                          <TouchableOpacity 
                            key={t.id} 
                            style={[styles.toppingChip, { borderColor: theme.border, backgroundColor: isSelected ? theme.accent : 'transparent' }]}
                            onPress={() => toggleTopping(inst.instanceId, t)}
                          >
                            <Text style={[styles.toppingText, { color: isSelected ? theme.accentText : theme.text }]}>
                              {t.name} (+₹{t.price_modifier})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <TouchableOpacity onPress={() => addAnother(inst)} style={styles.addAnotherBtn}>
                  <AntDesign name="plus" size={14} color={theme.accent} />
                  <Text style={[styles.addAnotherText, { color: theme.accent }]}>Add another {inst.name}</Text>
                </TouchableOpacity>
              </View>
          )})}

          {cartInstances.length > 0 && (
            <View style={[styles.chefNoteContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.chefNoteLabel, { color: theme.text }]}>Advice for Chef</Text>
              <TextInput
                style={[styles.chefNoteInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                placeholder="e.g. Make it extra spicy, No onions..."
                placeholderTextColor={theme.subText}
                multiline
                numberOfLines={3}
                value={chefNotes}
                onChangeText={setChefNotes}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footerContainer, { backgroundColor: theme.card }]}>
        <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.subText }]}>Subtotal</Text><Text style={[styles.summaryValue, { color: theme.text }]}>₹{subtotal.toFixed(2)}</Text></View>
        <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.subText }]}>Est. Delivery</Text><Text style={[styles.summaryValue, { color: theme.text }]}>₹{deliveryFee.toFixed(2)}</Text></View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryRow}><Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text><Text style={[styles.totalValue, { color: theme.text }]}>₹{(subtotal + deliveryFee).toFixed(2)}</Text></View>
        <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: theme.accent }]} onPress={handleProceed}>
            <Text style={[styles.checkoutBtnText, { color: theme.accentText }]}>Proceed to Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 }, 
  scrollContent: { paddingBottom: 20 }, 
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }, 
  backButton: { marginRight: 15 }, 
  headerTitle: { fontFamily: 'montserrat_bold', fontSize: 24 }, 

  progressContainer: { marginHorizontal: 20, marginBottom: 20, padding: 15, borderRadius: 16, borderWidth: 1, elevation: 2 },
  progressText: { fontFamily: 'montserrat_bold', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  progressBarBg: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  listContainer: { paddingHorizontal: 20 }, 
  cartCard: { borderRadius: 20, padding: 15, marginBottom: 15, elevation: 3 }, 
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  itemImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15 }, 
  itemDetails: { flex: 1, justifyContent: 'center' }, 
  itemName: { fontFamily: 'montserrat_medium', fontSize: 16, marginBottom: 5 }, 
  itemPrice: { fontFamily: 'montserrat_bold', fontSize: 16 }, 
  removeBtn: { padding: 5 },
  
  customPickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 15 },
  customPickerText: { fontFamily: 'montserrat_medium', fontSize: 14 },
  sizeOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 15, borderBottomWidth: 1 },
  sizeOptionText: { fontFamily: 'montserrat_medium', fontSize: 16 },
  sizeOptionPrice: { fontFamily: 'montserrat_bold', fontSize: 16 },

  toppingsContainer: { marginBottom: 10 },
  toppingsLabel: { fontFamily: 'montserrat_medium', fontSize: 12, marginBottom: 8 },
  chipsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toppingChip: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  toppingText: { fontFamily: 'montserrat_medium', fontSize: 12 },
  addAnotherBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, paddingVertical: 5 },
  addAnotherText: { fontFamily: 'montserrat_bold', fontSize: 14, marginLeft: 5 },
  emptyCartText: { textAlign: 'center', fontFamily: 'montserrat_regular', fontSize: 16, marginTop: 20 }, 
  chefNoteContainer: { padding: 20, borderRadius: 20, marginTop: 10, marginBottom: 20, elevation: 2 },
  chefNoteLabel: { fontFamily: 'montserrat_bold', fontSize: 16, marginBottom: 10 },
  chefNoteInput: { borderWidth: 1, borderRadius: 12, padding: 15, minHeight: 80, textAlignVertical: 'top', fontFamily: 'montserrat_regular' },
  footerContainer: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 10, marginTop: 'auto' }, 
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, 
  summaryLabel: { fontFamily: 'montserrat_regular', fontSize: 16 }, 
  summaryValue: { fontFamily: 'montserrat_bold', fontSize: 16 }, 
  divider: { height: 1, marginVertical: 10 }, 
  totalLabel: { fontFamily: 'montserrat_bold', fontSize: 20 }, 
  totalValue: { fontFamily: 'montserrat_bold', fontSize: 20 }, 
  checkoutButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 }, 
  checkoutBtnText: { fontFamily: 'montserrat_bold', fontSize: 16 }, 
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }, 
  modalContainer: { width: '80%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 }, 
  modalTitle: { fontFamily: 'montserrat_bold', fontSize: 20, marginBottom: 10, textAlign: 'center' }, 
  modalMessage: { fontFamily: 'montserrat_regular', fontSize: 16, marginBottom: 25, textAlign: 'center' }, 
  modalButtonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' }, 
  modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, minWidth: 100, alignItems: 'center' },
});

export default Checkout;