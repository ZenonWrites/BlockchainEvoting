import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import axios from 'axios';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update with your Django backend URL
const API_URL = 'http://192.168.0.146:8000/api';

export default function VotingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [votingStatus, setVotingStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => { fetchElections(); }, []);
  useEffect(() => {
    if (selectedElection) fetchCandidates(selectedElection.id);
  }, [selectedElection]);

  async function fetchElections() {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/elections/`);
      const list = Array.isArray(response.data?.results)
        ? response.data.results
        : [];
      setElections(list);
      if (list[0]) setSelectedElection(list[0]);
    } catch {
      Alert.alert('Error', 'Failed to fetch available elections.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCandidates(electionId) {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/candidates/?election=${electionId}`
      );
      const list = Array.isArray(response.data?.results)
        ? response.data.results
        : [];
      setCandidates(list);
    } catch {
      Alert.alert('Error', 'Failed to fetch candidates for this election.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Error', 'You must be authenticated to cast a vote.');
      return;
    }
    if (!selectedCandidate || !selectedElection) {
      Alert.alert('Selection Required', 'Please select a candidate to vote for.');
      return;
    }
    setVotingStatus('submitting');
    try {
      const response = await axios.post(
        `${API_URL}/votes/`,
        { election: selectedElection.id, candidate_id: selectedCandidate.id },
        { 
          headers: { 'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
         }, 
        }
      );
      if (response.data) {
        setVotingStatus('success');
        setModalVisible(true);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.detail?.includes('already voted')) {
        Alert.alert('Already Voted', 'You have already cast your vote.');
      } else {
        Alert.alert('Voting Failed', 'There was an error submitting your vote.');
        console.log('Vote error response:', error.response?.data);

      }
    }
  }

  function renderElectionItem({ item }) {
    return (
      <TouchableOpacity
        style={[
          styles.electionItem,
          item.id === selectedElection?.id && styles.selectedElectionItem
        ]}
        onPress={() => setSelectedElection(item)}
      >
        <Text style={styles.electionName}>{item.name}</Text>
        <Text style={styles.electionDate}>
          {new Date(item.start_date).toLocaleDateString()} – {new Date(item.end_date).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderCandidateItem({ item }) {
    return (
      <TouchableOpacity
        style={[
          styles.candidateCard,
          item.id === selectedCandidate?.id && styles.selectedCandidateCard
        ]}
        onPress={() => setSelectedCandidate(item)}
      >
        <View style={styles.candidateImagePlaceholder}>
          <Text style={styles.placeholderText}>
            {item.user_name.slice(0,2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>{item.user_name}</Text>
          <Text style={styles.candidateParty}>{item.party_name || 'Independent'}</Text>
          <Text style={styles.candidateBio} numberOfLines={2}>
            {item.manifesto || 'No manifesto available'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderSuccessModal() {
    return (
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => {
        setModalVisible(false);
        navigation.navigate('Home');
      }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Vote Successfully Cast!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setModalVisible(false); navigation.navigate('Home'); }}>
              <Text style={styles.buttonText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (loading && !elections.length) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading elections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Cast Your Vote</Text>
      <FlatList
        data={elections}
        renderItem={renderElectionItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.electionsList}
      />
      {selectedElection && (
        <View style={styles.candidatesContainer}>
          <Text style={styles.sectionTitle}>Candidates for {selectedElection.name}</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <FlatList
              data={candidates}
              renderItem={renderCandidateItem}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </View>
      )}
      <TouchableOpacity
        style={[styles.voteButton, (!selectedCandidate || votingStatus === 'submitting') && styles.disabledButton]}
        onPress={handleVote}
        disabled={!selectedCandidate || votingStatus === 'submitting'}
      >
        <Text style={styles.voteButtonText}>
          {selectedCandidate ? `Vote for ${selectedCandidate.user_name}` : 'Select a Candidate'}
        </Text>
      </TouchableOpacity>
      {renderSuccessModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  centered: { flex:1, justifyContent:'center', alignItems:'center' },
  headerTitle: { fontSize:24,fontWeight:'bold',marginBottom:12,textAlign:'center' },
  loadingText: { fontSize:16, color:'#666', marginTop:8 },
  electionsList: { paddingBottom:12 },
  electionItem: { padding:12, backgroundColor:'#fff', borderRadius:8, marginRight:10 },
  selectedElectionItem: { backgroundColor:'#e6f2ff', borderColor:'#4285F4', borderWidth:2 },
  electionName: { fontSize:16, fontWeight:'600' },
  electionDate: { fontSize:14, color:'#666' },
  candidatesContainer: { flex:1, marginTop:20 },
  sectionTitle: { fontSize:18, fontWeight:'bold', marginBottom:8 },
  candidateCard: { flexDirection:'row', padding:12, backgroundColor:'#fff', borderRadius:8, marginBottom:12, alignItems:'center' },
  selectedCandidateCard: { backgroundColor:'#e6f2ff', borderColor:'#4285F4', borderWidth:2 },
  candidateImagePlaceholder: { width:50,height:50,borderRadius:25,backgroundColor:'#ccc',justifyContent:'center',alignItems:'center',marginRight:12 },
  placeholderText: { fontSize:18, color:'#fff', fontWeight:'bold' },
  candidateInfo: { flex:1 },
  candidateName: { fontSize:16, fontWeight:'bold' },
  candidateParty: { fontSize:14, color:'#4285F4', marginVertical:4 },
  candidateBio: { fontSize:14, color:'#666' },
  voteButton: { backgroundColor:'#34A853', padding:14, borderRadius:8, alignItems:'center', marginTop:16 },
  disabledButton: { backgroundColor:'#A8E0B9' },
  voteButtonText: { color:'#fff', fontSize:18, fontWeight:'bold' },
  centeredView: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' },
  modalView: { backgroundColor:'#fff', padding:20, borderRadius:8, alignItems:'center' },
  modalTitle: { fontSize:18, fontWeight:'bold', marginBottom:12 },
  modalButton: { backgroundColor:'#4285F4', padding:10, borderRadius:8 },
  buttonText: { color:'#fff', fontSize:16 }
});
