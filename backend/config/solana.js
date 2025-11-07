import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

// Get Solana connection based on network
export const getSolanaConnection = () => {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  let endpoint;

  switch (network) {
    case 'mainnet-beta':
      endpoint = clusterApiUrl('mainnet-beta');
      break;
    case 'testnet':
      endpoint = clusterApiUrl('testnet');
      break;
    case 'devnet':
    default:
      endpoint = clusterApiUrl('devnet');
      break;
  }

  return new Connection(endpoint, 'confirmed');
};

// Get admin keypair from private key
export const getAdminKeypair = () => {
  try {
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('ADMIN_PRIVATE_KEY not found in environment variables');
    }

    // Decode base58 private key
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    console.error('❌ Error loading admin keypair:', error.message);
    throw error;
  }
};

// Get Solana explorer URL based on network
export const getExplorerUrl = (signature) => {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
};