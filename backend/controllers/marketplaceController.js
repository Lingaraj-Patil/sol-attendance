import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

// Create product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, tokenPrice, imageUrl, courseId, stock } = req.body;

    // Validate required fields
    if (!name || !description || !category || price === undefined || price < 0 || tokenPrice === undefined || tokenPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields with valid values'
      });
    }

    // Validate course if provided
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
    }

    const product = await Product.create({
      name,
      description,
      category,
      price: Number(price),
      tokenPrice: Number(tokenPrice),
      imageUrl,
      course: courseId || null,
      stock: stock !== undefined ? Number(stock) : -1,
      createdBy: req.user._id
    });

    await product.populate('course', 'name code');
    await product.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const { category, courseId, studentId } = req.query;
    const user = req.user;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (courseId) {
      query.course = courseId;
    }

    const products = await Product.find(query)
      .populate('course', 'name code description')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    // If studentId is provided, check which products are already purchased
    let productsWithPurchaseStatus = products;
    if (studentId || user.role === 'student') {
      const studentIdToCheck = studentId || user._id;
      const purchases = await Purchase.find({
        student: studentIdToCheck,
        status: 'completed'
      }).select('product');

      const purchasedProductIds = new Set(
        purchases.map(p => p.product.toString())
      );

      productsWithPurchaseStatus = products.map(product => {
        const productObj = product.toObject();
        productObj.isPurchased = purchasedProductIds.has(product._id.toString());
        return productObj;
      });
    }

    res.json({
      success: true,
      data: { products: productsWithPurchaseStatus }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get single product
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const product = await Product.findById(id)
      .populate('course', 'name code description')
      .populate('createdBy', 'name email');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if student has purchased this product
    let isPurchased = false;
    if (user.role === 'student') {
      const purchase = await Purchase.findOne({
        student: user._id,
        product: id,
        status: 'completed'
      });
      isPurchased = !!purchase;
    }

    const productObj = product.toObject();
    productObj.isPurchased = isPurchased;

    res.json({
      success: true,
      data: { product: productObj }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Purchase product (Student only)
export const purchaseProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const studentId = req.user._id;

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can purchase products'
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    // Check stock
    if (product.stock !== -1 && product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      student: studentId,
      product: productId,
      status: 'completed'
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this product'
      });
    }

    // Get student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student has enough tokens
    const currentBalance = Number(student.tokenBalance || 0);
    const requiredTokens = Number(product.tokenPrice);
    
    if (currentBalance < requiredTokens) {
      return res.status(400).json({
        success: false,
        message: `Insufficient tokens. You need ${requiredTokens} tokens but have ${currentBalance}`
      });
    }

    // Deduct tokens from student
    student.tokenBalance = Number(currentBalance - requiredTokens);
    await student.save();

    // Update stock if not unlimited
    if (product.stock !== -1 && product.stock > 0) {
      product.stock = Number(product.stock - 1);
      await product.save();
    }

    // Create purchase record
    const purchase = await Purchase.create({
      student: studentId,
      product: productId,
      tokenAmount: product.tokenPrice,
      status: 'completed'
    });

    await purchase.populate('product', 'name description category');
    await purchase.populate('student', 'name email');

    res.status(201).json({
      success: true,
      message: 'Product purchased successfully',
      data: {
        purchase,
        remainingBalance: student.tokenBalance
      }
    });
  } catch (error) {
    console.error('Purchase product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing product',
      error: error.message
    });
  }
};

// Get purchase history
export const getPurchaseHistory = async (req, res) => {
  try {
    const { studentId } = req.query;
    const user = req.user;

    let query = {};

    // Students can only see their own purchases
    if (user.role === 'student') {
      query.student = user._id;
    } else if (studentId) {
      // Admins/teachers can filter by student
      query.student = studentId;
    } else {
      // Admins can see all purchases
      // No filter needed
    }

    const purchases = await Purchase.find(query)
      .populate('product', 'name description category imageUrl course')
      .populate('student', 'name email')
      .populate({
        path: 'product',
        populate: {
          path: 'course',
          select: 'name code'
        }
      })
      .sort('-createdAt');

    res.json({
      success: true,
      data: { purchases }
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase history',
      error: error.message
    });
  }
};

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product
    Object.assign(product, updateData);
    await product.save();

    await product.populate('course', 'name code');
    await product.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Delete/Deactivate product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete - just deactivate
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

