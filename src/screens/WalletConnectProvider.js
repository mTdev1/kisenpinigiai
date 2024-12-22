import React, { createContext, useState, useEffect } from 'react';
import WalletConnect from '@walletconnect/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WalletConnectContext = createContext({
  connector: null,
  setConnector: () => {},
});

export const WalletConnectProvider = ({ children }) => {
  const [connector, setConnector] = useState(null);

  useEffect(() => {
    const initWalletConnect = async () => {
      const walletConnector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org', // Bridge server URL
        storageOptions: {
          asyncStorage: AsyncStorage,
        },
      });

      if (!walletConnector.connected) {
        walletConnector.createSession();
      }

      walletConnector.on('connect', (error, payload) => {
        if (error) {
          console.error(error);
          return;
        }
        console.log('Connected:', payload);
      });

      walletConnector.on('disconnect', (error) => {
        if (error) {
          console.error(error);
        }
        console.log('Disconnected');
      });

      setConnector(walletConnector);
    };

    initWalletConnect();
  }, []);

  return (
    <WalletConnectContext.Provider value={{ connector, setConnector }}>
      {children}
    </WalletConnectContext.Provider>
  );
};
