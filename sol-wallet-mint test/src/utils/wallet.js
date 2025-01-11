import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Default network
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

export const WalletContext = ({ children }) => {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <WalletProvider wallets={wallets} autoConnect endpoint={endpoint}>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
};

export const useConnectedWallet = () => {
  const { publicKey, signTransaction, connect } = useWallet();
  return { publicKey, signTransaction, connect };
};