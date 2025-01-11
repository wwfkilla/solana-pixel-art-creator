import React from 'react';
import { useConnectedWallet } from '../utils/wallet';
import { mintNFT } from '../utils/nftMinter';

const MintButton = ({ artMetadata }) => {
  const { publicKey, connect } = useConnectedWallet();

  const handleMint = async () => {
    if (!publicKey) {
      await connect();
    }
    try {
      const nft = await mintNFT(artMetadata);
      alert(`NFT Minted! Address: ${nft.address}`);
    } catch (error) {
      alert(`Mint failed: ${error.message}`);
    }
  };

  return <button onClick={handleMint}>Mint NFT</button>;
};

export default MintButton;