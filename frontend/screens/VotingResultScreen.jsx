import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';

const VotingResultScreen = ({ navigation, route }) => {
  const [votingResult, setVotingResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const electionId = route.params.electionId;

  useEffect(() => {
    const fetchVotingResult = async () => {
      try {
        const response = await axios.get(`[https://192.168.0.146:8000/api/voting-results/${electionId}/`);
        setVotingResult(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchVotingResult();
  }, [electionId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!votingResult) {
    return (
      <View style={styles.container}>
        <Text>No voting result found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Voting Result</Text>
      <Text style={styles.subheader}>Election: {votingResult.election.name}</Text>
      <Text style={styles.winner}>Winner: {votingResult.winner.user.username}</Text>
      <Text style={styles.totalVotes}>Total Votes: {votingResult.total_votes}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subheader: {
    fontSize: 18,
    marginBottom: 10,
  },
  winner: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalVotes: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default VotingResultScreen;