import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { WalletConnectContext } from './WalletConnectProvider';

const WalletConnectScreen = () => {
  const { connector } = useContext(WalletConnectContext);

  const connectWallet = () => {
    if (connector) {
      connector.connect();
    } else {
      console.log('WalletConnect connector is not initialized');
    }
  };

  return (
    <View>
      <Text>WalletConnect Integration</Text>
      <Button title="Connect Wallet" onPress={connectWallet} />
    </View>
  );
};

export default WalletConnectScreen;
