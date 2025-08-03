import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Setup Axios defaults and interceptor
axios.defaults.baseURL = 'http://192.168.0.146:8000';
axios.defaults.headers.common['Accept'] = 'application/json';

axios.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const checkPhoneNumber = async (phoneNumber) => {
  try {
    const response = await axios.get('/api/check-phone-number/', {
      params: { phone_number: phoneNumber }
    });
    return response.data.exists;
  } catch (error) {
    console.error('Error checking phone number:', error.message);
    return false;
  }
};

const requestOtp = async (phoneNumber) => {
  try {
     await axios.post(
         '/api/request-otp/',
         { phoneNumber: phoneNumber },          // match serializer’s field name
         { headers: { 'Content-Type': 'application/json' } }  // Axios sets this by default
       );
    Alert.alert('OTP Sent', 'An OTP has been sent to your SMS.');
    return true;
  } catch (error) {
    const status = error.response?.status;
    const data   = error.response?.data;
    console.error('Failed to request OTP:', status, data);  // :contentReference[oaicite:5]{index=5}
    Alert.alert(
      `Error ${status}`,
      JSON.stringify(data, null, 2)
    );
    return false;
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  try {
    await axios.post('/api/auth/phone-login/', { phone_number: phoneNumber, otp });
    return true;
  } catch (error) {
    console.error('OTP verification failed:', error.response?.data || error.message);
    return false;
  }
};


const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);

  const handleRequestOtp = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    setLoading(true);
    const success = await requestOtp(phoneNumber);
    if (success) setOtpRequested(true);
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!phoneNumber || !otp) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const verified = await verifyOtp(phoneNumber, otp);
    if (!verified) {
      Alert.alert('Login Error', 'Invalid OTP.');
      setLoading(false);
      return;
    }

    try {
      // Generate token via Phone number
      const { data } = await axios.post('/api/auth/phone-login/', {
        phone_number: phoneNumber,
        otp,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          "X-CSRFToken": "csrfToken"
        }
      });
      console.log('Login response:', data);
      const { token } = data;
      await AsyncStorage.setItem('userToken', token);

      // Fetch protected user resource
       const userResp = await axios.get('/api/auth/user/');
       const userData = userResp.data;

      Alert.alert('Success', 'Login successful!');
      navigation.navigate('Home', { user: userData });

    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      Alert.alert('Login Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        autoCapitalize="none"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      {otpRequested && (
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="numeric"
          value={otp}
          onChangeText={setOtp}
        />
      )}

      <View style={styles.buttonContainer}>
        {!otpRequested ? (
          <Button title={loading ? 'Requesting OTP...' : 'Request OTP'} onPress={handleRequestOtp} disabled={loading} />
        ) : (
          <Button title={loading ? 'Verifying...' : 'Login'} onPress={handleLogin} disabled={loading} />
        )}
      </View>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account?</Text>
        <Button title="Register" onPress={() => navigation.navigate('Register')} />
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
  },
  registerContainer: {
    marginTop: 20,
    alignItems: 'center'
  },
  registerText: {
    marginBottom: 10
  }
});

export default LoginScreen;
