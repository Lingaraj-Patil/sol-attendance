import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount
} from '@solana/spl-token';
import { getSolanaConnection, getAdminKeypair, getExplorerUrl } from '../config/solana.js';

class SolanaService {
  constructor() {
    this.connection = getSolanaConnection();
    this.adminKeypair = getAdminKeypair();
  }

  // Create attendance token mint
  async createAttendanceToken(name, symbol, decimals = 0) {
    try {
      console.log('🪙 Creating attendance token...');

      const mintAddress = await createMint(
        this.connection,
        this.adminKeypair,
        this.adminKeypair.publicKey,
        null,
        decimals
      );

      console.log('✅ Token created:', mintAddress.toBase58());

      return {
        mintAddress: mintAddress.toBase58(),
        name,
        symbol,
        decimals,
        mintAuthority: this.adminKeypair.publicKey.toBase58()
      };
    } catch (error) {
      console.error('❌ Error creating token:', error);
      throw new Error(`Failed to create token: ${error.message}`);
    }
  }

  // Get or create token account for a wallet
  async getOrCreateTokenAccount(walletAddress, mintAddress) {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.adminKeypair,
        mintPublicKey,
        walletPublicKey
      );

      return tokenAccount;
    } catch (error) {
      console.error('❌ Error getting/creating token account:', error);
      throw new Error(`Failed to get token account: ${error.message}`);
    }
  }

  // Transfer tokens to student for attendance
  async transferAttendanceTokens(studentWallet, mintAddress, amount) {
    try {
      console.log(`💸 Transferring ${amount} tokens to ${studentWallet}...`);

      const mintPublicKey = new PublicKey(mintAddress);

      // Get or create admin's token account
      const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.adminKeypair,
        mintPublicKey,
        this.adminKeypair.publicKey
      );

      // Check if admin has enough tokens, if not mint more
      const adminAccountInfo = await getAccount(
        this.connection,
        adminTokenAccount.address
      );

      let mintedAmount = 0;

      if (Number(adminAccountInfo.amount) < amount) {
        console.log('💰 Minting additional tokens to admin account...');
        mintedAmount = amount * 10;

        await mintTo(
          this.connection,
          this.adminKeypair,
          mintPublicKey,
          adminTokenAccount.address,
          this.adminKeypair,
          mintedAmount // Mint extra for future transfers
        );
      }

      // Get or create student's token account
      const studentTokenAccount = await this.getOrCreateTokenAccount(
        studentWallet,
        mintAddress
      );

      // Transfer tokens - transfer function returns TransactionSignature directly in v0.3.9
      const signature = await transfer(
        this.connection,
        this.adminKeypair,
        adminTokenAccount.address,
        studentTokenAccount.address,
        this.adminKeypair,
        amount
      );

      const explorerUrl = getExplorerUrl(signature);

      console.log('✅ Transfer successful!');
      console.log('📝 Signature:', signature);
      console.log('🔗 Explorer:', explorerUrl);

      return {
        signature,
        explorerUrl,
        amount,
        from: this.adminKeypair.publicKey.toBase58(),
        to: studentWallet,
        mintedAmount
      };
    } catch (error) {
      console.error('❌ Error transferring tokens:', error);
      throw new Error(`Failed to transfer tokens: ${error.message}`);
    }
  }

  // Get token balance for a wallet
  async getTokenBalance(walletAddress, mintAddress) {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.adminKeypair,
        mintPublicKey,
        walletPublicKey
      );

      const accountInfo = await getAccount(this.connection, tokenAccount.address);

      return Number(accountInfo.amount);
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      return 0;
    }
  }

  // Airdrop SOL for testing (devnet only)
  async airdropSol(walletAddress, amount = 1) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * 1e9 // Convert to lamports
      );

      await this.connection.confirmTransaction(signature);
      
      return {
        signature,
        explorerUrl: getExplorerUrl(signature)
      };
    } catch (error) {
      console.error('❌ Error airdropping SOL:', error);
      throw new Error(`Failed to airdrop SOL: ${error.message}`);
    }
  }
}

export default new SolanaService();