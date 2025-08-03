import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

// Update with your Django backend URL
const API_URL = 'http://192.168.0.146:8000/api/verification';

export default function VerificationResultScreen({ route, navigation }) {
  const { verificationData } = route.params || {};
  const [status, setStatus] = useState(verificationData?.verification_status || 'processing');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (verificationData && verificationData.verification_id) {
      fetchVerificationStatus();
    }
  }, [verificationData]);

  // Add navigation effect when status changes to 'verified'
  useEffect(() => {
    if (status === 'verified') {
      // Set a short delay before navigating to give user a chance to see the success message
      const timer = setTimeout(() => {
        navigation.navigate('Voting');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [status, navigation]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      console.log('Fetching verification status...');
      const response = await axios.get(`${API_URL}/status/`);
      console.log('API Response:', response.data);

      if (response.data.status === 'success') {
        setDetails(response.data.verification);
        setStatus(response.data.verification.status);
      } else {
        console.error('Unexpected API response:', response.data);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verified':
        return '#34A853';
      case 'failed':
        return '#EA4335';
      case 'processing':
        return '#FBBC05';
      default:
        return '#4285F4';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'verified':
        return 'Your identity has been successfully verified! Face match confirmed. Redirecting to voting screen...';
      case 'failed':
        return 'Verification failed. The selfie image does not match the ID document.';
      case 'processing':
        return 'Your verification is being processed...';
      default:
        return 'Waiting for verification result.';
    }
  };

  const renderDetails = () => {
    if (!details) return null;

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailTitle}>Verification Details</Text>
        <Text style={styles.detailText}>Document Type: {details.document_type || 'Not detected'}</Text>
        <Text style={styles.detailText}>Full Name: {details.full_name || 'Not detected'}</Text>
        <Text style={styles.detailText}>Date of Birth: {details.date_of_birth || 'Not detected'}</Text>
        <Text style={styles.detailText}>Face Match: {details.face_match ? 'Yes' : 'No'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Result</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#4285F4" style={styles.loader} />
      ) : (
        <>
          <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
          
          <Text style={styles.message}>{getStatusMessage()}</Text>
          
          {renderDetails()}
          
          {status === 'verified' ? (
            <TouchableOpacity 
              style={[styles.button, styles.proceedButton]}
              onPress={() => navigation.navigate('Voting')}
            >
              <Text style={styles.buttonText}>Proceed to Voting</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
          )}
          
          {status === 'failed' && (
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]}
              onPress={() => navigation.navigate('UploadID')}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  loader: {
    marginTop: 50,
  },
  statusContainer: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  proceedButton: {
    backgroundColor: '#34A853',
  },
  retryButton: {
    backgroundColor: '#EA4335',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});