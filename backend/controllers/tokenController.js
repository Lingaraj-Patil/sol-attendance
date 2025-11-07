import Token from '../models/Token.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import solanaService from '../services/solanaService.js';

// Create attendance token (Admin only)
export const createToken = async (req, res) => {
  try {
    const { name, symbol, decimals } = req.body;

    // Validate input
    if (!name || !symbol) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token name and symbol'
      });
    }

    // Check if token already exists
    const existingToken = await Token.findOne({ symbol });
    if (existingToken) {
      return res.status(400).json({
        success: false,
        message: 'Token with this symbol already exists'
      });
    }

    // Create token on Solana
    const tokenData = await solanaService.createAttendanceToken(
      name,
      symbol,
      decimals || 0
    );

    // Save to database
    const token = await Token.create(tokenData);

    res.status(201).json({
      success: true,
      message: 'Attendance token created successfully',
      data: { token }
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating token',
      error: error.message
    });
  }
};

// Get all tokens
export const getTokens = async (req, res) => {
  try {
    const tokens = await Token.find({ isActive: true });

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tokens',
      error: error.message
    });
  }
};

// Transfer tokens to a student wallet
export const transferTokens = async (req, res) => {
  try {
    const { studentId, tokenId, amount } = req.body;

    const numericAmount = Number(amount);

    if (
      !studentId ||
      !tokenId ||
      Number.isNaN(numericAmount) ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, tokenId and a valid amount'
      });
    }

    const token = await Token.findById(tokenId);
    if (!token || !token.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Token not found or inactive'
      });
    }

    if (token.decimals === 0 && !Number.isInteger(numericAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a whole number for this token'
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!student.walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Student wallet address is missing'
      });
    }

    const amountInBaseUnits = Math.round(
      numericAmount * Math.pow(10, token.decimals)
    );

    if (amountInBaseUnits <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is too small for the configured token decimals'
      });
    }

    const transferResult = await solanaService.transferAttendanceTokens(
      student.walletAddress,
      token.mintAddress,
      amountInBaseUnits
    );

    student.tokenBalance += numericAmount;
    await student.save();

    const mintedHuman = transferResult.mintedAmount
      ? transferResult.mintedAmount / Math.pow(10, token.decimals)
      : 0;

    if (mintedHuman > 0) {
      token.totalSupply = Number((token.totalSupply || 0) + mintedHuman);
      await token.save();
    }

    // Save transaction record
    try {
      await Transaction.create({
        type: 'manual_transfer',
        from: transferResult.from,
        to: transferResult.to,
        student: studentId,
        token: tokenId,
        amount: numericAmount,
        transactionSignature: transferResult.signature,
        explorerUrl: transferResult.explorerUrl,
        createdBy: req.user._id,
        description: `Manual token transfer of ${numericAmount} ${token.symbol}`
      });
    } catch (txError) {
      // Handle duplicate transaction signature (if transaction already exists)
      if (txError.code === 11000 || txError.name === 'MongoServerError') {
        console.log('Transaction already exists, skipping duplicate save');
      } else {
        console.error('Error saving transaction:', txError);
        // Continue even if transaction save fails
      }
    }

    res.json({
      success: true,
      message: 'Tokens transferred successfully',
      data: {
        signature: transferResult.signature,
        explorerUrl: transferResult.explorerUrl,
        amount: numericAmount,
        minted: mintedHuman,
        student: {
          id: student._id,
          name: student.name,
          walletAddress: student.walletAddress,
          tokenBalance: student.tokenBalance
        }
      }
    });
  } catch (error) {
    console.error('Transfer tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transferring tokens',
      error: error.message
    });
  }
};

// Get token details
export const getToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching token',
      error: error.message
    });
  }
};

// Get list of students eligible for token transfers
export const getTokenStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      isActive: true,
      walletAddress: { $exists: true, $ne: '' }
    }).select('name email walletAddress tokenBalance');

    res.json({
      success: true,
      data: { students }
    });
  } catch (error) {
    console.error('Get token students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const { walletAddress, tokenId } = req.query;

    if (!walletAddress || !tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide wallet address and token ID'
      });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    const balance = await solanaService.getTokenBalance(
      walletAddress,
      token.mintAddress
    );

    res.json({
      success: true,
      data: {
        walletAddress,
        tokenSymbol: token.symbol,
        balance
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balance',
      error: error.message
    });
  }
};

// Get transaction history
export const getTransactions = async (req, res) => {
  try {
    const { studentId, type, limit = 50 } = req.query;
    const user = req.user;

    let query = {};

    // Students can only see their own transactions
    if (user.role === 'student') {
      query.student = user._id;
    } else if (studentId) {
      // Admins/teachers can filter by student
      query.student = studentId;
    }

    if (type && ['attendance', 'manual_transfer'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate('student', 'name email walletAddress')
      .populate('token', 'name symbol')
      .populate({
        path: 'attendance',
        select: 'date status tokensAwarded',
        populate: {
          path: 'course',
          select: 'name code'
        }
      })
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { transactions }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};