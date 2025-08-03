import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import VotingResultScreen from './VotingResultScreen';

const HomeScreen = ({ navigation }) => {
  const [showElectionButtons, setShowElectionButtons] = useState(false);

  const handleCheckVotingResults = () => {
    setShowElectionButtons(true);
  };

  const handleCheckStateElectionResult = () => {
    navigation.navigate('VotingResult', { electionId: 1 });
  };

  const handleCheckCentralElectionResult = () => {
    navigation.navigate('VotingResult', { electionId: 2 });
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/verification-icon.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Blockchain E-Voting system</Text>
      <Text style={styles.subtitle}>
        Verify your identity to proceed for voting
      </Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('UploadID')}
      >
        <Text style={styles.buttonText}>Start Verification</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleCheckVotingResults}
      >
        <Text style={styles.buttonText}>Check Voting Results</Text>
      </TouchableOpacity>

      {showElectionButtons && (
        <View>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleCheckStateElectionResult}
          >
            <Text style={styles.buttonText}>Check State Election Result</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleCheckCentralElectionResult}
          >
            <Text style={styles.buttonText}>Check Central Election Result</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    width: 200,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
});

export default HomeScreen;