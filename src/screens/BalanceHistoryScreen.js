import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const BalanceHistoryScreen = ({ route, navigation }) => {
  const { childId } = route.params;
  const [childName, setChildName] = useState('');
  const [childBalance, setChildBalance] = useState({ EUR: 0, ETH: 0 });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;

    if (!user) {
      Alert.alert('Klaida', 'Vartotojas nėra autentifikuotas.');
      navigation.replace('Login');
      return;
    }

    // Gauti vaiko informaciją
    const childRef = database().ref(`/users/${user.uid}/children/${childId}`);
    childRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        setChildName(data.name || 'Vaikas');
        setChildBalance({
          EUR: data.balanceEUR || 0,
          ETH: data.balanceETH || 0,
        });
      }
    });

    // Gauti balansų istoriją
    const historyRef = database().ref(`/users/${user.uid}/children/${childId}/balanceHistory`);
    historyRef.on('value', snapshot => {
      const data = snapshot.val() || {};
      const historyList = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value,
      }));
      setHistory(historyList.sort((a, b) => new Date(b.date) - new Date(a.date))); // Rikiuojame pagal datą
    });

    return () => {
      childRef.off();
      historyRef.off();
    };
  }, [childId, navigation]);

  const renderItem = ({ item }) => {
    const rewardEUR = item.rewardEUR || 0; // Numatytasis 0, jei reikšmės nėra
    const rewardETH = item.rewardETH || 0;
    const parentBalanceEUR = item.parentBalanceEUR || 0;
    const parentBalanceETH = item.parentBalanceETH || 0;
  
    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyText}>
          {item.date || 'Nenurodyta data'} atlygis: 
          €{parseFloat(rewardEUR).toFixed(2)} / 
          {parseFloat(rewardETH).toFixed(6)} ETH | 
          Tėvo balansas: €{parseFloat(parentBalanceEUR).toFixed(2)} / 
          {parseFloat(parentBalanceETH).toFixed(6)} ETH
        </Text>
      </View>
    );
  };
  
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{childName} - suvestinė</Text>
      <Text style={styles.balanceText}>
        Balansas: €{childBalance.EUR.toFixed(2)} / {childBalance.ETH.toFixed(6)} ETH
      </Text>
  
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nėra įrašų.</Text>}
      />
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
    color: '#0d0c0c',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#0d0c0c',
  },
  balanceText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#0d0c0c',
  },
  historyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    color: '#0d0c0c',
  },
  historyText: {
    fontSize: 13,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
    marginTop: 20,
  },
});

export default BalanceHistoryScreen;
