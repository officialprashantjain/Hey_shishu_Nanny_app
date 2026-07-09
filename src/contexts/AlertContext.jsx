import React, { createContext, useContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/color';
import { fonts } from '../../constants/font';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState([]);

  // Emulates Alert.alert API
  const showAlert = (alertTitle, alertMessage, alertButtons) => {
    setTitle(alertTitle || '');
    setMessage(alertMessage || '');
    setButtons(alertButtons && alertButtons.length > 0 ? alertButtons : [{ text: 'OK', onPress: () => hideAlert() }]);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  const handlePress = (onPress) => {
    if (onPress) onPress();
    hideAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.alertBox}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
            
            <View style={styles.buttonContainer}>
              {buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    (btn.style === 'cancel' || btn.style === 'destructive') ? styles.cancelButton : styles.okButton
                  ]}
                  onPress={() => handlePress(btn.onPress)}
                >
                  <Text style={[
                     styles.buttonText, 
                     (btn.style === 'cancel' || btn.style === 'destructive') ? styles.cancelButtonText : styles.okButtonText
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  alertBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    // Android Shadow
    elevation: 5,
    // iOS Shadow
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  title: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  button: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  okButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  buttonText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    fontWeight: 'bold',
  },
  okButtonText: {
    color: colors.white,
  },
  cancelButtonText: {
    color: colors.description,
  },
});
