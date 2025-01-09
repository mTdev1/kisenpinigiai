import React, { createContext, useState, useEffect } from 'react';
import {useWallet} from '../hooks/useWallet';

const getBalance = hex => {
  if (!hex) {
    return 0;
  }

  return parseInt(hex, 16) / Math.pow(10, 18);
};

export const WalletConnectContext = createContext({
  account: null,
  connectToWallet: () => {},
  balance: null,
  connected: false,
});

export const WalletConnectProvider = ({children}) => {
  const {account, connectToWallet, balance, connected, ethereum} = useWallet();

  return (
    <WalletConnectContext.Provider
      value={{account, connectToWallet, balance, connected}}>
      {children}
    </WalletConnectContext.Provider>
  );
};
