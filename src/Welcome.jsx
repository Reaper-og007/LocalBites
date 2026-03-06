import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
// Import the icon set
import Icon from 'react-native-vector-icons/AntDesign';

const {width} = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        
        <View style={styles.imageContainer}>
          <Image
            source={require('./assets/img/localbitespng.png')} 
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* <View style={styles.textContainer}>
          <Text style={styles.title}>LocalBites</Text>
          <Text style={styles.subtitle}>Restaurant Finder</Text>
        </View> */}

        <View style={styles.buttonContainer}>
          {/* Clickable opacity with navigation trigger */}
          <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="arrowright" size={45} color="#FFF" />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  imageContainer: {
    flex: 0.5,
    justifyContent: 'center',
    marginTop: 50, 
  },
  heroImage: {
    marginTop: 190,
    width: width * 1.5,
    height: width * 1.5,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'montserrat_bold', // Match your lowercase filename
    fontSize: 32,
    color: '#000000',
  },
  subtitle: {
    fontFamily: 'montserrat_regular', // Match your lowercase filename
    fontSize: 18,
    color: '#333333',
  },
  buttonContainer: {
    marginBottom: 120,
  },
  button: {
    backgroundColor: '#6CC51D',
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

export default Welcome;