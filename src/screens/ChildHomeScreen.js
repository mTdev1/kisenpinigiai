import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { launchCamera } from 'react-native-image-picker'; // Image Picker import

const ChildHomeScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [failedTasks, setFailedTasks] = useState([]);
  const [balance, setBalance] = useState({ ETH: 0, EUR: 0 });
  const [userName, setUserName] = useState('');
  const [submissionTask, setSubmissionTask] = useState(null);
  const [description, setDescription] = useState('');
  const [photoURI, setPhotoURI] = useState(null); // Saugo nuotraukos URI

  useEffect(() => {
    const user = auth().currentUser;

    if (!user) {
      Alert.alert('Klaida', 'Vartotojas nėra autentifikuotas.');
      return;
    }

    // Nuskaitome vaiko vardą ir balansą
    database()
      .ref(`/users/${user.uid}`)
      .on('value', snapshot => {
        const data = snapshot.val() || {};
        setUserName(data.name || 'Vaikas');
        setBalance({
          ETH: data.balanceETH || 0,
          EUR: data.balanceEUR || 0,
        });
        const tasks = data.tasks || {};
        const allTasks = Object.entries(tasks).map(([id, task]) => ({
          id,
          ...task,
        }));
        setTasks(allTasks.filter(task => task.status === 'active'));
        setCompletedTasks(allTasks.filter(task => task.status === 'completed'));
        setPendingTasks(allTasks.filter(task => task.status === 'waiting_for_review'));
        setFailedTasks(allTasks.filter(task => task.status === 'failed'));
      });
  }, []);

  const handleCapturePhoto = async () => {
    launchCamera(
      { mediaType: 'photo', includeBase64: true },
      response => {
        if (response.didCancel) {
          Alert.alert('Atšaukta', 'Nuotraukos pasirinkimas buvo atšauktas.');
        } else if (response.errorCode) {
          Alert.alert('Klaida', `Kameros klaida: ${response.errorMessage}`);
        } else if (response.assets && response.assets.length > 0) {
          const base64Image = response.assets[0].base64;
          setPhotoURI(`data:image/jpeg;base64,${base64Image}`); // Saugo Base64 kaip URI
        }
      }
    );
  };

  const submitTask = async taskID => {
    const user = auth().currentUser;

    if (!description.trim()) {
      Alert.alert('Klaida', 'Prašome įvesti aprašymą.');
      return;
    }

    try {
      if (photoURI) {
        await database()
          .ref(`/users/${user.uid}/tasks/${taskID}`)
          .update({
            status: 'waiting_for_review',
            description: description,
            proofImageBase64: photoURI, // Saugo Base64 nuotrauką tiesiai į DB
          });
      } else {
        await database()
          .ref(`/users/${user.uid}/tasks/${taskID}`)
          .update({
            status: 'waiting_for_review',
            description: description,
          });
      }

      Alert.alert('Pateikta', 'Užduotis pateikta tėvų patvirtinimui.');
      setSubmissionTask(null); // Uždarome pateikimo langą
      setDescription('');
      setPhotoURI(null);
    } catch (error) {
      console.error('Klaida pateikiant užduotį:', error);
      Alert.alert('Klaida', 'Nepavyko pateikti užduoties.');
    }
  };

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

  const renderTask = (task, actionLabel, action) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => {
        if (!action) {
          navigation.navigate('TaskDetails', { taskId: task.id, childId: auth().currentUser.uid });
        } else {
          action(task.id);
        }
      }}
    >
      <Text>Užduotis: {task.description}</Text>
      <Text>Atlygis: {task.rewardETH} ETH ({task.rewardEUR} EUR)</Text>
      <Text>Terminas: {new Date(task.deadline).toLocaleString()}</Text>
      {action && <Button title={actionLabel} onPress={() => action(task.id)} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Atsijungimo mygtukas */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>⇦</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Labas, {userName}!</Text>
      <Text>Balansas: {balance.ETH} ETH ({balance.EUR} EUR)</Text>

      {/* Atliekamos užduotys */}
      <Text style={styles.sectionTitle}>Atliekamos užduotys</Text>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) =>
          renderTask(item, 'Pateikti užduotį', () => setSubmissionTask(item))
        }
        ListEmptyComponent={<Text>Šiuo metu nėra aktyvių užduočių.</Text>}
      />

      {/* Laukiama peržiūros */}
      <Text style={styles.sectionTitle}>Laukiama peržiūros</Text>
      <FlatList
        data={pendingTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => renderTask(item)} // Tik rodymas su navigacija
        ListEmptyComponent={<Text>Šiuo metu nėra laukiamų peržiūros užduočių.</Text>}
      />

      {/* Atliktos užduotys */}
      <Text style={styles.sectionTitle}>Atliktos užduotys</Text>
      <FlatList
        data={completedTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => renderTask(item)} // Tik rodymas su navigacija
        ListEmptyComponent={<Text>Šiuo metu nėra atliktų užduočių.</Text>}
      />

      {/* Neįvykdytos užduotys */}
      <Text style={styles.sectionTitle}>Neįvykdytos užduotys</Text>
      <FlatList
        data={failedTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => renderTask(item)} // Tik rodymas su navigacija
        ListEmptyComponent={<Text>Šiuo metu nėra neįvykdytų užduočių.</Text>}
      />

      {/* Užduoties pateikimo modalas */}
      {submissionTask && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Pateikti užduotį</Text>
          <Text>Užduotis: {submissionTask.description}</Text>
          <TextInput
            style={styles.input}
            placeholder="Aprašymas apie atliktą užduotį"
            value={description}
            onChangeText={setDescription}
          />
          {photoURI && (
            <Image source={{ uri: photoURI }} style={styles.imagePreview} />
          )}
          <Button title="Nufotografuoti" onPress={handleCapturePhoto} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => submitTask(submissionTask.id)}
          >
            <Text style={styles.buttonText}>Pateikti</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setSubmissionTask(null)}
          >
            <Text style={styles.buttonText}>Atšaukti</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  taskItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  modal: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChildHomeScreen;
