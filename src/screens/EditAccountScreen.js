import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {useWallet} from '../hooks/useWallet';

const EditAccountScreen = ({route, navigation}) => {
  const {accountId, isChild} = route.params || {};
  const {account, connectToWallet, connected} = useWallet();

  const [parentName, setParentName] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentConfirmPassword, setParentConfirmPassword] = useState('');
  const [parentMetaMask, setParentMetaMask] = useState('');
  const [childName, setChildName] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [childConfirmPassword, setChildConfirmPassword] = useState('');
  const [childMetaMask, setChildMetaMask] = useState('');

  useEffect(() => {
    const parentUID = auth().currentUser?.uid;

    if (parentUID) {
      // Gauti tėvo informaciją
      const parentRef = database().ref(`/users/${parentUID}`);
      parentRef.once('value', snapshot => {
        const data = snapshot.val();
        if (data) {
          setParentName(data.name || '');
          setParentMetaMask(data.metaMaskWallet || '');
        }
      });

      // Gauti vaiko informaciją, jei pasirinktas vaikas
      if (accountId) {
        const childRef = database().ref(
          `/users/${parentUID}/children/${accountId}`,
        );
        childRef.once('value', snapshot => {
          const data = snapshot.val();
          if (data) {
            setChildName(data.name || '');
            setChildMetaMask(data.metaMaskWallet || '');
          }
        });
      }
    }
  }, [accountId]);

  const handleUpdateParentInfo = () => {
    if (parentPassword && parentPassword !== parentConfirmPassword) {
      Alert.alert('Klaida', 'Tėvo slaptažodžiai nesutampa.');
      return;
    }

    if (parentMetaMask && parentMetaMask.length !== 42) {
      Alert.alert('Klaida', 'MetaMask adresas turi būti 42 simbolių ilgio.');
      return;
    }

    const parentUID = auth().currentUser?.uid;
    const updates = {name: parentName, metaMaskWallet: parentMetaMask};

    if (parentPassword) {
      auth()
        .currentUser.updatePassword(parentPassword)
        .catch(error =>
          Alert.alert('Klaida', 'Nepavyko atnaujinti tėvo slaptažodžio.'),
        );
    }

    database()
      .ref(`/users/${parentUID}`)
      .update(updates)
      .then(() => Alert.alert('Sėkmė', 'Tėvo informacija atnaujinta.'))
      .catch(error => Alert.alert('Klaida', error.message));
  };

  const handleUpdateChildInfo = () => {
    if (!accountId) {
      Alert.alert('Klaida', 'Pasirinktas vaikas nerastas.');
      return;
    }

    if (childPassword && childPassword !== childConfirmPassword) {
      Alert.alert('Klaida', 'Vaiko slaptažodžiai nesutampa.');
      return;
    }

    if (childMetaMask && childMetaMask.length !== 42) {
      Alert.alert('Klaida', 'MetaMask adresas turi būti 42 simbolių ilgio.');
      return;
    }

    const parentUID = auth().currentUser?.uid;
    const updates = {name: childName, metaMaskWallet: childMetaMask};

    database().ref(`/users/${accountId}`).update(updates);

    database()
      .ref(`/users/${parentUID}/children/${accountId}`)
      .update(updates)
      .then(() => Alert.alert('Sėkmė', 'Vaiko informacija atnaujinta.'))
      .catch(error => Alert.alert('Klaida', error.message));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Redaguoti paskyrą</Text>

      {/* Tėvo informacijos redagavimas */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Tėvo informacija</Text>
        <TextInput
          placeholder="Tėvo vardas"
          placeholderTextColor="#050505"
          style={styles.input}
          value={parentName}
          onChangeText={setParentName}
        />
        <TextInput
          placeholder="Naujas slaptažodis (pasirinktinai)"
          placeholderTextColor="#050505"
          style={styles.input}
          value={parentPassword}
          onChangeText={setParentPassword}
          secureTextEntry
        />
        <TextInput
          placeholder="Patvirtinti slaptažodį"
          placeholderTextColor="#050505"
          style={styles.input}
          value={parentConfirmPassword}
          onChangeText={setParentConfirmPassword}
          secureTextEntry
        />
        <TextInput
          placeholder="MetaMask piniginės adresas"
          placeholderTextColor="#050505"
          style={styles.input}
          editable={false}
          value={account}
        />
        {!account || !connected ? (
          <TouchableOpacity style={styles.button} onPress={connectToWallet}>
            <Text style={styles.buttonText}>Prijungti MetaMask</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.button}
          onPress={handleUpdateParentInfo}>
          <Text style={styles.buttonText}>Atnaujinti tėvo informaciją</Text>
        </TouchableOpacity>
      </View>

      {/* Vaiko informacijos redagavimas */}
      {accountId && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Vaiko informacija</Text>
          <TextInput
            placeholder="Vaiko vardas"
            placeholderTextColor="#050505"
            style={styles.input}
            value={childName}
            onChangeText={setChildName}
          />
          <TextInput
            placeholder="Naujas slaptažodis (pasirinktinai)"
            placeholderTextColor="#050505"
            style={styles.input}
            value={childPassword}
            onChangeText={setChildPassword}
            secureTextEntry
          />
          <TextInput
            placeholder="Patvirtinti slaptažodį"
            placeholderTextColor="#050505"
            style={styles.input}
            value={childConfirmPassword}
            onChangeText={setChildConfirmPassword}
            secureTextEntry
          />
          <TextInput
            placeholder="MetaMask piniginės adresas"
            placeholderTextColor="#050505"
            style={styles.input}
            value={childMetaMask}
            onChangeText={setChildMetaMask}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdateChildInfo}>
            <Text style={styles.buttonText}>Atnaujinti vaiko informaciją</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
    color: '#050505',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#050505',
  },
  block: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#050505',
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#050505',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    color: '#050505',
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    color: '#050505',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditAccountScreen;
