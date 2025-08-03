
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import 'react-native-get-random-values'; 
import '@ethersproject/shims'; // Import the ethers shims
import { ethers } from 'ethers';
import * as DocumentPicker from 'expo-document-picker';

const RegisterScreen = ({ navigation }) => {
  // Form state for registration fields
  
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [lastName, setLastName] = useState('');

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [voterId, setVoterId] = useState('');
  const [adhaarNumber, setAdhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const username = firstName + '@' +phoneNumber ;

  const uploadFile = async (setFile) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
      });
  
      if (result.type === 'success') {
        setFile(result);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  };

  // Handle the registration process
  const handleRegister = async () => {
    if (!username || !email || !phoneNumber || !voterId || !adhaarNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address;
    const privateKey = wallet.privateKey;
  
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('phone_number', phoneNumber);
    formData.append('voter_id', voterId);
    formData.append('adhaar_number', adhaarNumber);
    formData.append('wallet_address', walletAddress);
    formData.append('private_key', privateKey);
    formData.append('address', address);
  
    const mnemonic = wallet.mnemonic.phrase;
    Alert.alert('Wallet Created', `Please backup your mnemonic phrase: ${mnemonic}`);
  
    setLoading(true);
  
    try {
      const response = await axios.post('http://192.168.0.146:8000/main/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      Alert.alert('Success', 'Registration successful!');
      setLoading(false);
      // Optionally, you can navigate to another screen after successful registration
      navigation.navigate('LoginScreen');
    } catch (error) {
      setLoading(false);
  
      if (error.response && error.response.data) {
        const errorMessages = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
  
        Alert.alert('Registration Error', errorMessages);
      } else {
        Alert.alert('Registration Error', 'An unexpected error occurred.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create your voter account/अपना मतदाता खाता बनाएं</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name/पहला नाम"
        autoCapitalize="none"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Father's Name/पिता का नाम"
        autoCapitalize="none"
        value={fatherName}
        onChangeText={setFatherName}
        />

      <TextInput
        style={styles.input}
        placeholder="Last Name/उपनाम"
        autoCapitalize="none"
        value={lastName}
        onChangeText={setLastName}
      />


      <TextInput
        style={styles.input}
        placeholder="Email/ईमेल"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number/फोन नंबर"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

<TextInput
        style={styles.input}
        placeholder="Voter ID/मतदाता पहचान पत्र"
        keyboardType="phone-pad"
        value={voterId}
        onChangeText={setVoterId}
      />

      <TextInput
        style={styles.input}
        placeholder="Adhaar Number/आधार नंबर"
        keyboardType="phone-pad"
        value={adhaarNumber} // Corrected
        onChangeText={setAdhaarNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="Address/पता"
        autoCapitalize="none"
        value={address}
        onChangeText={setAddress}
      />


      <View style={styles.buttonContainer}>
        <Button title={loading ? 'Registering...' : 'Register'} onPress={handleRegister} disabled={loading} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15
  },
  buttonContainer: {
    marginTop: 10
  }
});

export default RegisterScreen;
