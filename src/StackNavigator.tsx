import React, {useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ParentHomeScreen from './screens/ParentHomeScreen';
import RegisterChildScreen from './screens/RegisterChildScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import ChildProgressScreen from './screens/ChildProgressScreen';
import TaskDetailsScreen from './screens/TaskDetailsScreen';
import EditAccountScreen from './screens/EditAccountScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import ChildHomeScreen from './screens/ChildHomeScreen';
import BalanceHistoryScreen from './screens/BalanceHistoryScreen'; // Pridedame šį ekraną
import WalletConnectScreen from './screens/WalletConnectScreen';
import {WalletConnectProvider} from './screens/WalletConnectProvider';

const RootStack = createNativeStackNavigator();

const StackNavigator = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null | undefined>(
    undefined,
  );
  const [role, setRole] = useState<string | null | undefined>(undefined);

  auth().onAuthStateChanged(async user => {
    const dbRef = database().ref(`/users/${user?.uid}/role`);
    const snapshot = await dbRef.once('value');
    const userRole = snapshot.val();
    setRole(userRole);
    setUser(user);
  });

  if (user === undefined) {
    return null;
  }

  return (
    <WalletConnectProvider>
      <RootStack.Navigator
        initialRouteName={
          user ? (role === 'child' ? 'ChildHome' : 'ParentHome') : 'Login'
        }>
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <RootStack.Screen
          name="WalletConnect"
          component={WalletConnectScreen}
          options={{title: 'Piniginės prijungimas'}} // Nustatykite pavadinimą
        />
        <RootStack.Screen
          name="Register"
          component={RegisterScreen}
          options={{title: 'Registracija'}}
        />
        <RootStack.Screen
          name="ParentHome"
          component={ParentHomeScreen}
          options={{headerShown: false}}
        />
        <RootStack.Screen
          name="RegisterChild"
          component={RegisterChildScreen}
          options={{title: 'Vaiko registracija'}}
        />
        <RootStack.Screen
          name="CreateTask"
          component={CreateTaskScreen}
          options={{title: 'Užduočių kūrimas'}}
        />
        <RootStack.Screen
          name="ChildProgress"
          component={ChildProgressScreen}
          options={{title: 'Vaiko progreso istorija'}}
        />
        <RootStack.Screen
          name="TaskDetails"
          component={TaskDetailsScreen}
          options={{title: 'Užduoties detalės'}}
        />
        <RootStack.Screen
          name="EditAccount"
          component={EditAccountScreen}
          options={{title: 'Paskyros redagavimas'}}
        />
        <RootStack.Screen
          name="EditTask"
          component={EditTaskScreen}
          options={{title: 'Redaguoti užduotį'}}
        />
        <RootStack.Screen
          name="ChildHome"
          component={ChildHomeScreen} // Čia pridėtas ekranas
          options={{headerShown: false}}
        />
        <RootStack.Screen
          name="BalanceHistory"
          component={BalanceHistoryScreen}
          options={{title: 'Balanso istorija'}}
        />
      </RootStack.Navigator>
    </WalletConnectProvider>
  );
};

export default StackNavigator;
