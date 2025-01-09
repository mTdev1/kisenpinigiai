import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {useWallet} from '../hooks/useWallet';

const ChildProgressScreen = ({route, navigation}) => {
  const {childId, childWalletId} = route.params;
  const [childName, setChildName] = useState('');
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [failedTasks, setFailedTasks] = useState([]);
  const [childBalance, setChildBalance] = useState(0);
  const [pendingTasks, setPendingTasks] = useState([]);

  const {getAccountBalance} = useWallet();

  useEffect(() => {
    getAccountBalance(childWalletId).then(result => {
      setChildBalance(result);
    });
  }, []);

  useEffect(() => {
    if (!childId) {
      Alert.alert('Klaida', 'Vaiko ID nerastas.');
      navigation.goBack();
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Klaida', 'Vartotojas nėra autentifikuotas.');
      navigation.replace('Login');
      return;
    }

    // Gauti vaiko vardą ir balansą
    const childRef = database().ref(`/users/${user.uid}/children/${childId}`);
    childRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        setChildName(data.name || 'Vaikas');
        setChildBalance(data.balanceETH || 0);
      }
    });

    // Gauti vaiko užduotis
    const tasksRef = database().ref(`/users/${childId}/tasks`);
    tasksRef.on('value', snapshot => {
      const data = snapshot.val() || {};
      const tasks = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value,
      }));
      setActiveTasks(tasks.filter(task => task.status === 'active'));
      setCompletedTasks(tasks.filter(task => task.status === 'completed'));
      setFailedTasks(tasks.filter(task => task.status === 'failed'));
      setPendingTasks(
        tasks.filter(task => task.status === 'waiting_for_review'),
      );
    });

    return () => {
      childRef.off();
      tasksRef.off();
    };
  }, [childId, navigation]);

  const renderTask = ({item}) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() =>
        navigation.navigate('TaskDetails', {taskId: item.id, childId})
      }>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskReward}>
        Atlygis: €{item.rewardEUR} ({item.rewardETH} ETH)
      </Text>
      <Text style={styles.taskDeadline}>
        Terminas: {new Date(item.deadline).toLocaleDateString()}
      </Text>
      <Text style={styles.taskStatus}>Statusas: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vaiko progreso istorija: {childName}</Text>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceTitle}>Vaiko balansas:</Text>
        {/* <Text style={styles.balanceText}>
          EUR: €{childBalance.eur.toFixed(2)}
        </Text> */}
        <Text style={styles.balanceText}>ETH: {childBalance || 0} ETH</Text>
      </View>

      <Text style={styles.sectionTitle}>Atliekamos užduotys</Text>
      <FlatList
        data={activeTasks}
        renderItem={({item}) => (item ? renderTask({item}) : null)}
        keyExtractor={(item, index) => item?.id || index.toString()}
        ListEmptyComponent={
          <Text style={{color: '#6e6969'}}>
            Šiuo metu nėra aktyvių užduočių.
          </Text>
        }
      />

      <Text style={styles.sectionTitle}>Laukiama peržiūros</Text>
      <FlatList
        data={pendingTasks}
        renderItem={({item}) => (item ? renderTask({item}) : null)}
        keyExtractor={(item, index) => item?.id || index.toString()}
        ListEmptyComponent={
          <Text style={{color: '#6e6969'}}>
            Šiuo metu nėra laukiamų peržiūros užduočių.
          </Text>
        }
      />

      <Text style={styles.sectionTitle}>Atliktos užduotys</Text>
      <FlatList
        data={completedTasks}
        renderItem={({item}) => (item ? renderTask({item}) : null)}
        keyExtractor={(item, index) => item?.id || index.toString()}
        ListEmptyComponent={
          <Text style={{color: '#6e6969'}}>
            Šiuo metu nėra atliktų užduočių.
          </Text>
        }
      />

      <Text style={styles.sectionTitle}>Neįvykdytos užduotys</Text>
      <FlatList
        data={failedTasks}
        renderItem={({item}) => (item ? renderTask({item}) : null)}
        keyExtractor={(item, index) => item?.id || index.toString()}
        ListEmptyComponent={
          <Text style={{color: '#6e6969'}}>
            Šiuo metu nėra neįvykdytų užduočių.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  balanceContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    Color: '#050505',
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#050505',
  },
  balanceText: {
    fontSize: 16,
    color: '#050505',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#050505',
  },
  taskItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#050505',
  },
  taskDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050505',
  },
  taskReward: {
    fontSize: 14,
    color: '#333',
  },
  taskDeadline: {
    fontSize: 14,
    color: '#555',
  },
  taskStatus: {
    fontSize: 14,
    color: '#777',
  },
});

export default ChildProgressScreen;
