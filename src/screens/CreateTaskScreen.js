import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateTaskScreen = ({ navigation }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [rewardEUR, setRewardEUR] = useState('');
  const [rewardETH, setRewardETH] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const ethRate = 1800; // Pvz.: 1 ETH = 1800 EUR (atnaujinkite pagal realų kursą)

  useEffect(() => {
    const user = auth().currentUser;

    if (!user) {
      Alert.alert('Klaida', 'Vartotojas nėra autentifikuotas.');
      navigation.replace('Login');
      return;
    }

    const parentUID = user.uid;

    // Nuskaityti vaikus iš duomenų bazės
    const childrenRef = database().ref(`/users/${parentUID}/children`);
    childrenRef.on('value', snapshot => {
      const data = snapshot.val() || {};
      const childrenList = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value,
      }));
      setChildren(childrenList);
      if (childrenList.length > 0 && !selectedChild) {
        setSelectedChild(childrenList[0].id);
      }
    });

    return () => {
      childrenRef.off('value');
    };
  }, [navigation, selectedChild]);

  const handleRewardChange = (eurValue) => {
    setRewardEUR(eurValue);
    const ethValue = (parseFloat(eurValue) / ethRate).toFixed(6); // Konvertuoti į ETH
    setRewardETH(ethValue);
  };

  const handleCreateTask = () => {
    if (!selectedChild || !taskDescription.trim() || !rewardEUR.trim()) {
      Alert.alert('Klaida', 'Prašome užpildyti visus laukus.');
      return;
    }

    const parentUID = auth().currentUser.uid;
    const taskData = {
      description: taskDescription,
      rewardEUR: rewardEUR,
      rewardETH: rewardETH,
      deadline: deadline.toISOString(),
      status: 'active', // Užduoties būsena
      createdBy: parentUID,
    };

    database()
      .ref(`/users/${selectedChild}/tasks`)
      .push(taskData)
      .then(() => {
        Alert.alert('Sėkmingai', 'Užduotis sukurta!');
        navigation.goBack();
      })
      .catch(error => {
        Alert.alert('Klaida', 'Nepavyko sukurti užduoties. Bandykite dar kartą.');
        console.error('Task creation error:', error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sukurti užduotį</Text>

      {/* Vaiko pasirinkimas */}
      <Text style={styles.label}>Pasirinkite vaiką:</Text>
      <Picker
        selectedValue={selectedChild}
        onValueChange={value => setSelectedChild(value)}
        style={styles.picker}
      >
        {children.map(child => (
          <Picker.Item key={child.id} label={child.name} value={child.id} />
        ))}
      </Picker>

      {/* Užduoties aprašymas */}
      <Text style={styles.label}>Užduoties aprašymas:</Text>
      <TextInput
        style={styles.input}
        placeholder="Įveskite užduoties aprašymą"
        value={taskDescription}
        onChangeText={setTaskDescription}
      />

      {/* Atlygio nustatymas */}
      <Text style={styles.label}>Atlygis (EUR):</Text>
      <TextInput
        style={styles.input}
        placeholder="Įveskite atlygio sumą eurais"
        keyboardType="decimal-pad"
        value={rewardEUR}
        onChangeText={handleRewardChange}
      />
      <Text style={styles.ethText}>ETH: {rewardETH || '0.000000'} ETH</Text>

      {/* Užduoties atlikimo terminas */}
      <Text style={styles.label}>Atlikimo terminas:</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.datePickerText}>
          {deadline.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={deadline}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDeadline(selectedDate);
            }
          }}
        />
      )}

      {/* Išsaugoti užduotį */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleCreateTask}
        activeOpacity={0.7}
      >
        <Text style={styles.saveButtonText}>Sukurti užduotį</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  picker: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  ethText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  datePickerButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateTaskScreen;
