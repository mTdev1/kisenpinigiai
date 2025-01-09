import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');



  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Klaida', 'Prašome užpildyti visus laukus.');
      return;
    }

    auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const userUID = userCredential.user.uid;

        // Saugo naudotojo informaciją Firebase
        database()
          .ref(`/users/${userUID}`)
          .set({
            name,
            email,
            role: 'parent', // Tik tėvas gali registruotis
          })
          .then(() => {
            Alert.alert('Sėkmė', 'Paskyra sėkmingai sukurta!');
            navigation.replace('ParentHome');
          })
          .catch((error) => {
            console.error('Klaida išsaugant vartotoją į duomenų bazę:', error);
            Alert.alert('Klaida', 'Nepavyko išsaugoti vartotojo į duomenų bazę.');
          });
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('Klaida', 'Šis el. paštas jau naudojamas.');
        } else {
          Alert.alert('Klaida', error.message);
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registracija</Text>
      <TextInput
        placeholder="Vardas"
        placeholderTextColor= "#050505"
        style={styles.input}
        value={name}
        onChangeText={setName}

      />
      <TextInput
        placeholder="El. paštas"
        placeholderTextColor="#050505"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Slaptažodis"
        placeholderTextColor="#050505"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <Text style={styles.buttonText}>Registruotis</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: "#050505",
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    color: "#050505",
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,

  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
