import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import database from '@react-native-firebase/database';

const EditTaskScreen = ({ route, navigation }) => {
  const { taskId, childId } = route.params;

  const [taskDetails, setTaskDetails] = useState({});
  const [description, setDescription] = useState('');
  const [rewardEUR, setRewardEUR] = useState('');
  const [rewardETH, setRewardETH] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!taskId || !childId) {
      Alert.alert('Klaida', 'Užduoties arba vaiko ID nerastas.');
      navigation.goBack();
      return;
    }

    const taskRef = database().ref(`/users/${childId}/tasks/${taskId}`);
    taskRef.once('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        setTaskDetails(data);
        setDescription(data.description || '');
        setRewardEUR(data.rewardEUR ? data.rewardEUR.toString() : '');
        setRewardETH(data.rewardETH ? data.rewardETH.toString() : '');
        setDeadline(data.deadline ? new Date(data.deadline) : null);
      }
    });
  }, [taskId, childId, navigation]);

  const calculateETH = eur => {
    const conversionRate = 0.0003; // Laikinas valiutos kursas
    return (eur * conversionRate).toFixed(6);
  };

  const handleSaveTask = () => {
    if (!description.trim() || !rewardEUR.trim() || !deadline) {
      Alert.alert('Klaida', 'Visi laukai turi būti užpildyti.');
      return;
    }

    const taskRef = database().ref(`/users/${childId}/tasks/${taskId}`);
    taskRef
      .update({
        description,
        rewardEUR: parseFloat(rewardEUR),
        rewardETH: calculateETH(parseFloat(rewardEUR)),
        deadline: deadline.getTime(),
      })
      .then(() => {
        Alert.alert('Išsaugota', 'Užduotis sėkmingai atnaujinta.');
        navigation.goBack();
      })
      .catch(error => Alert.alert('Klaida', error.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redaguoti užduotį</Text>

      <Text style={styles.label}>Aprašymas</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Įveskite užduoties aprašymą"
      />

      <Text style={styles.label}>Atlygis (EUR)</Text>
      <TextInput
        style={styles.input}
        value={rewardEUR}
        onChangeText={value => {
          setRewardEUR(value);
          setRewardETH(calculateETH(parseFloat(value) || 0));
        }}
        placeholder="Įveskite atlygį eurais"
        keyboardType="numeric"
      />
      <Text style={styles.ethText}>ETH: {rewardETH} ETH</Text>

      <Text style={styles.label}>Terminas</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>
          {deadline ? deadline.toLocaleDateString() : 'Pasirinkite datą'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={deadline || new Date()}
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

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
        <Text style={styles.buttonText}>Išsaugoti</Text>
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
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  ethText: {
    marginBottom: 15,
    fontSize: 14,
    color: '#555',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditTaskScreen;
