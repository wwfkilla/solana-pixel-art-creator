import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { useConnectedWallet } from './wallet';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export const mintNFT = async (metadata) => {
  const { publicKey } = useConnectedWallet();

  if (!publicKey) {
    throw new Error('Wallet not connected');
  }

  const metaplex = Metaplex.make(connection).use(keypairIdentity(publicKey));

  try {
    // Assuming you have a way to upload metadata to IPFS or similar
    const { uri } = await metaplex.storage().uploadJson(metadata);

    const { nft } = await metaplex.nfts().create({
      uri: uri,
      name: metadata.name,
      symbol: metadata.symbol,
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints || 500,
    }, { payer: publicKey });

    return nft;
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
};