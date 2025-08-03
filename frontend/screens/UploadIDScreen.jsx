import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// Update with your Django backend URL
const API_URL = 'http://192.168.0.146:8000/api/verification';  // 10.0.2.2 points to localhost from Android emulator

export default function UploadIDScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to use this feature');
        return;
      }
  
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Enables cropping
        quality: 1,
      });
  
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setExtractedData(null); // Reset extracted data
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to use this feature');
        return;
      }
  
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // Enables cropping
        quality: 1,
      });
  
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setExtractedData(null); // Reset extracted data
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('No image', 'Please select or take a photo of your ID document');
      return;
    }

    setLoading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('id_document', {
        uri: image,
        name: 'id_document.jpg',
        type: 'image/jpeg',
      });

      // Upload to server
      const response = await axios.post(
        `${API_URL}/upload-id/`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setExtractedData(response.data.extracted_data);
      Alert.alert(
        'Success', 
        'ID document uploaded successfully. Please confirm the extracted information is correct.'
      );
    } catch (error) {
      Alert.alert(
        'Upload Failed', 
        error.response?.data?.message || error.message || 'Failed to upload ID document'
      );
    } finally {
      setLoading(false);
    }
  };

  const proceedToSelfie = () => {
    navigation.navigate('TakeSelfie');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Document for Verification</Text>
      <Text style={styles.instructions}>
        Please upload a clear photo of your ID document  (Passport, Driver's License, Aadhaar Card, etc.)
      </Text>

      {image ? (
        <Image source={{ uri: image }} style={styles.imagePreview} />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Select from Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {image && !extractedData && (
        <TouchableOpacity 
          style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={uploadImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload ID Document</Text>
          )}
        </TouchableOpacity>
      )}

      {extractedData && (
        <View style={styles.extractedDataContainer}>
          <Text style={styles.dataTitle}>Extracted Information</Text>
          <Text style={styles.dataText}>Document Type: {extractedData.document_type || 'Not detected'}</Text>
          <Text style={styles.dataText}>Document Number: {extractedData.document_number || 'Not detected'}</Text>
          <Text style={styles.dataText}>Name: {extractedData.full_name || 'Not detected'}</Text>
          <Text style={styles.dataText}>Date of Birth: {extractedData.date_of_birth || 'Not detected'}</Text>
          
          <TouchableOpacity 
            style={styles.buttonPrimary}
            onPress={proceedToSelfie}
          >
            <Text style={styles.buttonText}>Proceed to Selfie</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  placeholderContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#34A853',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  extractedDataContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dataText: {
    fontSize: 16,
    marginBottom: 5,
  },
});