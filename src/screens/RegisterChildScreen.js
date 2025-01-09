import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const RegisterChildScreen = ({navigation}) => {
  const [childName, setChildName] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [parentPassword, setParentPassword] = useState(''); // Papildomas laukas tėvo slaptažodžiui

  const handleRegisterChild = async () => {
    if (
      !childName.trim() ||
      !childEmail.trim() ||
      !childPassword.trim() ||
      !parentPassword.trim()
    ) {
      Alert.alert('Klaida', 'Prašome užpildyti visus laukus.');
      return;
    }

    const parent = auth().currentUser;

    if (!parent) {
      Alert.alert('Klaida', 'Tėvas nėra autentifikuotas.');
      return;
    }

    const parentUID = parent.uid;
    const parentEmail = parent.email; // Išsaugome tėvo el. paštą

    try {
      await auth().signInWithEmailAndPassword(parentEmail, parentPassword); // Prisijungiame tėvą
      // Sukuriame vaiko paskyrą Firebase Authentication
      const childCredential = await auth().createUserWithEmailAndPassword(
        childEmail,
        childPassword,
      );

      await auth().signInWithEmailAndPassword(parentEmail, parentPassword);

      const childUID = childCredential.user.uid;

      // Pridedame vaiką į tėvo vaikų sąrašą
      await database().ref(`/users/${parentUID}/children/${childUID}`).set({
        name: childName,
        email: childEmail,
      });

      // Pridedame vaiko duomenis į atskirą duomenų bazės įrašą
      await database().ref(`/users/${childUID}`).set({
        name: childName,
        email: childEmail,
        role: 'child',
        parentUID: parentUID,
      });

      Alert.alert('Sėkminga registracija', 'Vaikas sėkmingai užregistruotas!');

      navigation.goBack();
    } catch (error) {
      console.error('Klaida registruojant vaiką:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Klaida', 'Šis el. pašto adresas jau yra naudojamas.');
      } else {
        Alert.alert('Klaida', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vaiko registracija</Text>
      <TextInput
        placeholder="Vaiko vardas"
        placeholderTextColor="#0d0c0c"
        style={styles.input}
        value={childName}
        onChangeText={setChildName}
      />
      <TextInput
        placeholder="Vaiko el. paštas"
        placeholderTextColor="#0d0c0c"
        style={styles.input}
        value={childEmail}
        onChangeText={setChildEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Vaiko slaptažodis"
        placeholderTextColor="#0d0c0c"
        style={styles.input}
        value={childPassword}
        onChangeText={setChildPassword}
        secureTextEntry
      />
      <TextInput
        placeholder="Tėvo slaptažodis"
        placeholderTextColor="#0d0c0c"
        style={styles.input}
        value={parentPassword}
        onChangeText={setParentPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleRegisterChild} style={styles.button}>
        <Text style={styles.buttonText}>Registruoti vaiką</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    color: '#0d0c0c',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0d0c0c',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    color: '#0d0c0c',
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    color: '#0d0c0c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RegisterChildScreen;
