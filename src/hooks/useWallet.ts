import {useEffect, useState} from 'react';
import {useSDK} from '@metamask/sdk-react';
import {BigNumber, ethers} from 'ethers';

const parseBalance = (hex: string) => {
  if (!hex) {
    return 0;
  }

  return parseInt(hex, 16) / Math.pow(10, 18);
};

const useWallet = () => {
  const [ethRate, setEthRate] = useState(3200);

  useEffect(() => {
    const fetchEthRate = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur',
        );
        const data = await response.json();
        setEthRate(data.ethereum.eur);
        console.log('ETH rate:', data.ethereum.eur);
      } catch (error) {
        console.error('Error fetching ETH rate:', error);
      }
    };

    fetchEthRate();
  }, []);

  const {
    sdk,
    provider: ethereum,
    chainId,
    account,
    balance,
    connected,
  } = useSDK();

  const connectToWallet = async () => {
    try {
      sdk?.connect();
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  const convertEthToEur = (eth: number) => {
    if (!eth) {
      return Number(0).toFixed(2);
    }
    return (eth * ethRate).toFixed(2);
  };

  const convertEurToEth = (eur: number) => {
    if (!eur) {
      return Number(0);
    }
    return eur / ethRate;
  };

  const convertEthToWei = (eth: number) => {
    if (!eth) {
      return 0;
    }

    return ethers.utils.parseUnits(eth.toString(), 18);
  };

  const getAccountBalance = async (address: string) => {
    try {
      if (!address) {
        return 0;
      }
      const response = await ethereum?.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return parseBalance(response as string);
    } catch (error) {
      console.error('Error getting account balance:', error);
    }
  };

  const pay = async (amount: number, address: string) => {
    try {
      if (!address && !ethereum?.isConnected()) {
        return;
      }
      const value = BigNumber.from(
        convertEthToWei(convertEurToEth(amount)),
      ).toHexString();
      const response = await ethereum?.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to: address,
            value,
          },
        ],
      });
      console.log('Transaction response:', response);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };

  return {
    account,
    connectToWallet,
    balance,
    chainId,
    connected,
    ethereum,
    convertEthToEur,
    parseBalance,
    getAccountBalance,
    convertEurToEth,
    pay,
  };
};

export {useWallet};
