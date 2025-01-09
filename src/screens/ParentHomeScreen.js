import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {Picker} from '@react-native-picker/picker';
import {useWallet} from '../hooks/useWallet';

const ParentHomeScreen = ({navigation}) => {
  const [userName, setUserName] = useState('');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childBalance, setChildBalance] = useState(0);
  const {
    account,
    balance,
    parseBalance,
    connected,
    connectToWallet,
    convertEthToEur,
    getAccountBalance,
    pay,
  } = useWallet();

  useEffect(() => {
    const user = auth().currentUser;

    if (!user) {
      Alert.alert('Klaida', 'Vartotojas nėra autentifikuotas.');
      navigation.replace('Login');
      return;
    }

    const parentUID = user.uid;

    // Nuskaityti vartotojo vardą
    const userRef = database().ref(`/users/${parentUID}`);
    userRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        setUserName(data.name || 'Tėvas');
      }
    });

    // Nuskaityti tik šio tėvo vaikus
    const childrenRef = database().ref(`/users/${parentUID}/children`);
    childrenRef.on('value', snapshot => {
      const data = snapshot.val() || {};
      const childrenList = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value,
      }));
      setChildren(childrenList);
      if (childrenList.length > 0 && !selectedChild) {
        setSelectedChild(childrenList[0]);
      }
    });

    return () => {
      userRef.off('value');
      childrenRef.off('value');
    };
  }, [navigation, selectedChild]);

  const handleLogout = () => {
    auth()
      .signOut()
      .then(() => {
        navigation.replace('Login');
      })
      .catch(error => {
        Alert.alert('Klaida', 'Nepavyko atsijungti. Bandykite dar kartą.');
        console.error('Logout Error:', error);
      });
  };

  const getChildBalance = async () => {
    if (connected) {
      try {
        const response = await getAccountBalance(selectedChild?.metaMaskWallet);
        setChildBalance(response);
      } catch (err) {
        console.error('Error getting balance:', err);
      }
    }
  };
  const getCurrentAccountBalance = async () => {
    await connectToWallet();
    if (connected) {
      try {
        await getAccountBalance(account);
      } catch (err) {
        console.error('Error getting balance:', err);
      }
    }
  };

  useEffect(() => {
    getAccountBalance(selectedChild?.metaMaskWallet).then(result => {
      setChildBalance(result);
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Atsijungimo mygtukas */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Text style={styles.logoutText}>⇦</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sveiki, {userName}!</Text>
        {/* Dropdown pasirinkti vaiką */}
        <Text style={styles.label}>Pasirinkite vaiką:</Text>
        <Picker
          selectedValue={selectedChild}
          onValueChange={value => setSelectedChild(value)}
          style={styles.picker}>
          {children.map(child => (
            <Picker.Item key={child.id} label={child.name} value={child} />
          ))}
        </Picker>
        {/* Kvadratiniai mygtukai */}
        <View style={styles.buttonGrid}>
          {Boolean(selectedChild) && (
            <TouchableOpacity
              style={styles.squareButton}
              onPress={() =>
                navigation.navigate('CreateTask', {childId: selectedChild.id})
              }>
              <Text style={styles.buttonText}>Užduočių kūrimas</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => {
              if (!selectedChild) {
                Alert.alert('Klaida', 'Prašome pasirinkti vaiką.');
                return;
              }
              navigation.navigate('EditAccount', {
                accountId: selectedChild?.id, // Perduodame pasirinkto vaiko ID
                isChild: true, // Nurodome, kad tai vaiko paskyra
              });
            }}>
            <Text style={styles.buttonText}>Redaguoti paskyras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => navigation.navigate('RegisterChild')}>
            <Text style={styles.buttonText}>Vaikų registracija</Text>
          </TouchableOpacity>

          {Boolean(selectedChild) && (
            <TouchableOpacity
              style={styles.squareButton}
              onPress={() =>
                navigation.navigate('ChildProgress', {
                  childId: selectedChild.id,
                  childWalletId: selectedChild.metaMaskWallet,
                })
              }>
              <Text style={styles.buttonText}>Vaiko progreso istorija</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.footer}>
          {Boolean(account) && connected ? (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceTitle}>Tėvo balansas:</Text>
              {/* <Text style={styles.balanceText}>EUR: {account}</Text> */}
              <Text style={styles.balanceText}>
                ETH: {parseBalance(balance)} ETH
              </Text>
              <Text style={styles.balanceText}>
                EUR: {convertEthToEur(parseBalance(balance))} €
              </Text>

              <Text style={styles.balanceTitle}>Vaiko balansas:</Text>
              {/* <Text style={styles.balanceText}>EUR: €{childBalance.eur}</Text> */}
              <Text style={styles.balanceText}>ETH: {childBalance} ETH</Text>
              <Text style={styles.balanceText}>
                EUR: {convertEthToEur(childBalance)} €
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.transactionButton}
            onPress={() =>
              navigation.navigate('BalanceHistory', {
                childId: selectedChild.id,
              })
            }>
            <Text style={styles.transactionButtonText}>
              Peržiūrėti sandorius
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.transactionButton}
            onPress={() => getCurrentAccountBalance()}>
            <Text style={styles.transactionButtonText}>Atnaujinti balansą</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.transactionButton}
            onPress={() => getChildBalance()}>
            <Text style={styles.transactionButtonText}>
              Gauti vaiko balansą
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  logoutButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ff4d4d',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#050505',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#050505',
  },
  picker: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 5,
    color: '#050505',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
    color: '#050505',
  },
  squareButton: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  balanceContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#6e6969',
    borderRadius: 10,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  balanceText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#fff',
  },
  transactionButton: {
    marginTop: 10,
    backgroundColor: '#00b894',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  transactionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050505',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export default ParentHomeScreen;
