import React, { useContext } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { ThemeContext } from './context/ThemeContext';

const {width} = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <Image
            source={require('./assets/img/localbitespng.png')} 
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.accent }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="arrowright" size={45} color={theme.accentText} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 50 },
  imageContainer: { flex: 0.5, justifyContent: 'center', marginTop: 50 },
  heroImage: { marginTop: 190, width: width * 1, height: width * 1 },
  buttonContainer: { marginBottom: 120 },
  button: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', elevation: 8 },
});

export default Welcome;