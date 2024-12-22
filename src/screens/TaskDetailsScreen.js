import React, { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import database from '@react-native-firebase/database';

const TaskDetailsScreen = ({ route, navigation }) => {
  const { taskId, childId } = route.params;

  const [taskDetails, setTaskDetails] = useState({});
  const [taskProof, setTaskProof] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Klaida', 'Vartotojas nėra autentifikuotas.');
        navigation.replace('Login');
        return;
      }

      const roleRef = database().ref(`/users/${user.uid}/role`);
      roleRef.once('value', snapshot => {
        setUserRole(snapshot.val());
      });
    };

    fetchUserRole();

    if (!taskId || !childId) {
      Alert.alert('Klaida', 'Užduoties arba vaiko ID nerastas.');
      navigation.goBack();
      return;
    }

    const taskRef = database().ref(`/users/${childId}/tasks/${taskId}`);
    taskRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        setTaskDetails(data);
        setTaskProof(data.proofImageBase64 || null);
      }
    });

    return () => taskRef.off();
  }, [taskId, childId, navigation]);

  const handleApproveTask = async () => {
    if (taskDetails.status !== 'waiting_for_review') {
      Alert.alert('Klaida', 'Užduoties statusas neleidžia patvirtinimo.');
      return;
    }
  
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Klaida', 'Vartotojas nėra autentifikuotas.');
        return;
      }
  
      // Nuskaitome dabartinius tėvo ir vaiko balansus
      const parentRef = database().ref(`/users/${user.uid}`);
      const childRef = database().ref(`/users/${childId}`);
      const parentSnapshot = await parentRef.once('value');
      const childSnapshot = await childRef.once('value');
  
      const parentData = parentSnapshot.val();
      const childData = childSnapshot.val();
  
      if (!parentData || !childData) {
        Alert.alert('Klaida', 'Nepavyko nuskaityti balansų.');
        return;
      }
  
      // Užduoties atlygis
      const rewardEUR = taskDetails.rewardEUR || 0;
      const rewardETH = taskDetails.rewardETH || 0;
  
      const newParentBalanceEUR = (parentData.balanceEUR || 0) - rewardEUR;
      const newParentBalanceETH = (parentData.balanceETH || 0) - rewardETH;
      const newChildBalanceEUR = (childData.balanceEUR || 0) + rewardEUR;
      const newChildBalanceETH = (childData.balanceETH || 0) + rewardETH;
  
      // Atnaujiname balansus
      await parentRef.update({
        balanceEUR: newParentBalanceEUR,
        balanceETH: newParentBalanceETH,
      });
  
      await childRef.update({
        balanceEUR: newChildBalanceEUR,
        balanceETH: newChildBalanceETH,
      });
  
      // Pridedame įrašą į balanso istoriją
      const historyRef = database().ref(`/users/${user.uid}/children/${childId}/balanceHistory`);
      await historyRef.push({
        date: new Date().toISOString(),
        rewardEUR,
        rewardETH,
        parentBalanceEUR: newParentBalanceEUR,
        parentBalanceETH: newParentBalanceETH,
      });
  
      // Atnaujiname užduoties statusą
      const taskRef = database().ref(`/users/${childId}/tasks/${taskId}`);
      await taskRef.update({ status: 'completed' });
  
      Alert.alert('Patvirtinta', 'Užduotis buvo patvirtinta.');
      navigation.goBack();
    } catch (error) {
      console.error('Klaida patvirtinant užduotį:', error);
      Alert.alert('Klaida', 'Nepavyko patvirtinti užduoties.');
    }
  };
  
  

  const handleRejectTask = () => {
    if (taskDetails.status !== 'waiting_for_review') {
      Alert.alert('Klaida', 'Užduoties statusas neleidžia atmetimo.');
      return;
    }

    const taskRef = database().ref(`/users/${childId}/tasks/${taskId}`);
    taskRef.update({ status: 'failed' })
      .then(() => {
        Alert.alert('Atmesta', 'Užduotis buvo atmesta.');
        navigation.goBack();
      })
      .catch(error => Alert.alert('Klaida', error.message));
  };

  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return '#90EE90';
      case 'failed':
        return '#FFB6C1';
      default:
        return '#fff';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Užduoties detalės</Text>

      <View style={[styles.detailsContainer, { backgroundColor: getStatusColor(taskDetails.status) }]}>
        <Text style={styles.label}>Aprašymas:</Text>
        <Text style={styles.value}>{taskDetails.description || 'Nėra'}</Text>

        <Text style={styles.label}>Atlygis:</Text>
        <Text style={styles.value}>
          €{taskDetails.rewardEUR || 0} ({taskDetails.rewardETH || 0} ETH)
        </Text>

        <Text style={styles.label}>Terminas:</Text>
        <Text style={styles.value}>
          {taskDetails.deadline
            ? new Date(taskDetails.deadline).toLocaleDateString()
            : 'Nenurodyta'}
        </Text>

        <Text style={styles.label}>Statusas:</Text>
        <Text style={styles.value}>{taskDetails.status || 'Nežinoma'}</Text>
      </View>

      {taskProof ? (
        <View style={styles.proofContainer}>
          <Text style={styles.label}>Vaiko pateikti įrodymai:</Text>
          <Image source={{ uri: taskProof }} style={{ width: 200, height: 200 }} />
        </View>
      ) : (
        taskDetails.status === 'waiting_for_review' && (
          <Text style={styles.noProof}>Įrodymai nepateikti.</Text>
        )
      )}

      {taskDetails.status === 'waiting_for_review' && userRole === 'parent' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.approveButton} onPress={handleApproveTask}>
            <Text style={styles.buttonText}>Patvirtinti</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rejectButton} onPress={handleRejectTask}>
            <Text style={styles.buttonText}>Atmesti</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  detailsContainer: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
  },
  proofContainer: {
    marginBottom: 20,
  },
  noProof: {
    fontSize: 16,
    color: '#FF6347',
    textAlign: 'center',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    marginRight: 5,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    marginLeft: 5,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TaskDetailsScreen;
