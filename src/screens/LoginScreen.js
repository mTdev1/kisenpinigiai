import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }

    auth()
      .signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        const userUID = userCredential.user.uid;

        // Patikrinti naudotojo rolę Firebase duomenų bazėje
        database()
          .ref(`/users/${userUID}/role`)
          .once('value')
          .then(snapshot => {
            const role = snapshot.val();
            if (role === 'parent') {
              navigation.replace('ParentHome'); // Nukreipia į tėvų langą
            } else if (role === 'child') {
              navigation.replace('ChildHome'); // Nukreipia į vaikų langą
            } else {
              Alert.alert('Error', 'Role not defined.');
            }
          })
          .catch(error => {
            console.error('Error fetching role:', error);
            Alert.alert('Error', 'Failed to fetch user role.');
          });
      })
      .catch(error => {
        if (error.code === 'auth/wrong-password') {
          Alert.alert('Login Failed', 'Incorrect password.');
        } else if (error.code === 'auth/user-not-found') {
          Alert.alert('Login Failed', 'No user found with this email.');
        } else {
          Alert.alert('Login Failed', error.message);
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#050505"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#050505"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      {/* Registracijos mygtukas */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
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
    borderColor: '#506fad',
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
  linkButton: {
    marginTop: 10,


  },
  linkText: {
    color: '#6200ee',
    textDecorationLine: 'underline',

  },
});

export default LoginScreen;
