import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false); // Prevents the white flash on boot

  // 1. READ FROM STORAGE ON BOOT
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@localbites_theme');
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error("Failed to load theme preference from storage:", error);
      } finally {
        // Tells the app it's safe to render the UI now
        setIsThemeLoaded(true);
      }
    };
    
    loadTheme();
  }, []);

  // 2. WRITE TO STORAGE ON TOGGLE
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('@localbites_theme', JSON.stringify(newMode));
    } catch (error) {
      console.error("Failed to save theme preference to storage:", error);
    }
  };

  const theme = {
    bg: isDarkMode ? '#14151C' : '#FAFAFA',
    card: isDarkMode ? '#1E2235' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#A0A0B0' : '#888888',
    border: isDarkMode ? '#2A2E45' : '#EEEEEE',
    accent: '#BFF549', 
    accentText: '#000000', 
    danger: '#FF4444',
  };

  // 3. THE "NO FLASH" GUARD
  // Do not render the app until we know which theme to show, otherwise it flashes white.
  if (!isThemeLoaded) {
    return null; 
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};