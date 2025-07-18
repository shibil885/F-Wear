const User = require('../models/userModel')
const Category = require('../models/categoriesModel')
const Products = require('../models/productModel')
const Orders = require('../models/orderModel')
require('dotenv').config()
const {
  sendSuccess,
  sendError,
  MESSAGES,
  COMMON_MESSAGES,
  STATUS_CODES
} = require('../util')

async function chart() {
  try {
    const ordersPie = await Orders.find()
    const ordersCount = {
      cashOnDelivery: 0,
      razorPay: 0,
      wallet: 0
    }
    const paymentMethod = {
      cashOnDelivery: 'cashOnDelivery',
      razorPay: 'razorPay',
      wallet: 'wallet'
    }
    ordersPie.forEach((order) => {
      if (order.paymentMethod === paymentMethod.cashOnDelivery) {
        ordersCount.cashOnDelivery++
      } else if (order.paymentMethod === paymentMethod.razorPay) {
        ordersCount.razorPay++
      } else if (order.paymentMethod === paymentMethod.wallet) {
        ordersCount.wallet++
      }
    })

    return ordersCount;
  } catch (error) {
    throw new Error(COMMON_MESSAGES.INTERNAL_SERVER_ERROR);
  }
}

const adminLogin = (req, res, next) => {
  try {
    res.render('admin/adminLogin')
  } catch (error) {
    next(error)
  }
}

const adminValidation = (req, res, next) => {
  try {
    if ((process.env.ADMIN_MAIL !== req.body.email) || (process.env.ADMIN_PASS !== req.body.password)) {
      res.render('admin/adminLogin', { alert: MESSAGES.auth.INVALID_CREDENTIALS })
    } else {
      req.session.admin = req.body.email
      req.session.isLoggedAdmin = true
      res.redirect('/adminPanel')
    }
  } catch (error) {
    next(error)
  }
}

const adminPanel = async (req, res, next) => {
  try {
    const products = await Products.find()
    const users = await User.find()
    const orders = await Orders.find({ paymentStatus: 'paid' })
    const categories = await Category.find()
    const ordersPie = await chart()

    let totalOrderPrice = 0;
    orders.forEach(order => {
      totalOrderPrice += order.totalPrice || 0;
    });

    res.render("admin/adminPanel", { users: users, orders: orders, products: products, ordersPie: ordersPie, categories: categories, totalOrderPrice });
  } catch (error) {
    next(error)
  }
}

const adminLogout = (req, res, next) => {
  try {
    req.session.admin = null
    req.session.isLoggedAdmin = false
    res.redirect('adminLogin')
  } catch (error) {
    next(error)
  }
}
const users = async (req, res, next) => {
  try {
    const users = await User.find()
    res.render('admin/users', { users });
  } catch (error) {
    next(error)
  }
}

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    let { isBlock } = req.body;

    if (!userId) {
      return sendError(res, { message: COMMON_MESSAGES.ID_REQUIRED, status: STATUS_CODES.BAD_REQUEST, icon: 'warning' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBlocked: isBlock },
      { new: true }
    );

    if (!updatedUser) {
      return sendError(res, { message: COMMON_MESSAGES.USER_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
    }

    sendSuccess(res, {
      message: `User has been ${isBlock ? 'blocked' : 'unblocked'} successfully`,
      data: { user: updatedUser }
    });

  } catch (error) {
    sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};


const fetchDashboard = async (req, res, next) => {
  try {
    const users = await User.find().exec();
    const orders = await Orders.find().exec();
    const products = await Products.find().exec();
    const ordersPie = await chart();


    sendSuccess(res, {
      data: {
        users,
        orders,
        products,
        ordersPie
      }
    });
  } catch (err) {
    next(err);
  }
}

const generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const orders = await Orders.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('products.productId');
    const reportData = orders.map((order) => {
      let totalPrice = 0;
      order.products.forEach(product => {
        totalPrice += product.salesPrice * product.quantity;
      });

      return {
        orderId: order._id,
        date: order.date,
        totalPrice,
        products: order.products.map(product => {
          return {
            productName: product.productId.product_title,
            quantity: product.quantity,
            price: product.salesPrice
          };
        }),
        firstName: order.firstName,
        lastName: order.lastName,
        address: order.address,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus
      };
    });
    res.status(STATUS_CODES.OK).json({ reportData });
  } catch (err) {
    sendError(res, { message: MESSAGES.user.REPORT_ERROR });
  }
};

// const report = (req, res) => {
//   const filePath = '../temp/report.pdf';
//   res.sendFile(filePath, { root: '.' }, (err) => {
//     if (err) {
//       console.error('Error sending file:', err);
// res.status(STATUS_CODES.NOT_FOUND).send('File not found');
//     }
//   });
// }

const bestProducts = async (req, res, next) => {
  try {
    const bestSellingProducts = await Orders.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          totalQuantity: { $sum: '$products.quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'productmodels',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: '$product._id',
          productTitle: '$product.product_title',
          totalQuantity: 1,
        },
      },
    ]);

    res.status(STATUS_CODES.OK).render('admin/bestProducts', { bestSellingProducts })
  } catch (error) {
    next(error)
  }
}
const bestCategories = async (req, res, next) => {
  try {
    const bestSellingCategories = await Orders.aggregate([
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'productmodels',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.categoryId',
          totalQuantity: { $sum: '$products.quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: '$category._id',
          category: '$category.category',
          totalQuantity: 1,
        },
      },
    ]);
    res.render('admin/bestCategory', { bestSellingCategories });
  } catch (error) {
    next(error)
  }
}
const bestBrands = async (req, res) => {
  try {
    const bestSellingBrands = await Orders.aggregate([
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'productmodels',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.brandId',
          totalQuantity: { $sum: '$products.quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'brands',
          localField: '_id',
          foreignField: '_id',
          as: 'brand',
        },
      },
      { $unwind: '$brand' },
      {
        $project: {
          _id: '$_id',
          brandName: '$brand.name',
          totalQuantity: 1,
        },
      },
    ]);
    res.render('admin/bestBrand', { bestSellingBrands });
  } catch (error) {
    console.error(error);
  }
};
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sales = async (req, res) => {
  try {
    const { timeframe } = req.query;
    let startDate, endDate;

    if (timeframe === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      endDate = new Date();
    } else if (timeframe === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date();
    } else if (timeframe === 'yearly') {
      endDate = new Date();
      startDate = new Date(endDate.getFullYear(), 0, 1);
      console.log(startDate);
    } else {
      return sendError(res, { message: MESSAGES.user.INVALID_TIMEFRAME, status: STATUS_CODES.BAD_REQUEST });
    }

    const orders = await Orders.find({
      date: { $gte: startDate, $lte: endDate },
      paymentStatus: 'paid'
    });

    const salesData = {};
    if (timeframe === 'weekly') {
      for (let i = 0; i < 7; i++) {
        const date = formatDate(new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)));
        salesData[date] = 0;
      }
    } else if (timeframe === 'monthly') {
      for (let i = 0; i < 30; i++) {
        const date = formatDate(new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)));
        salesData[date] = 0;
      }
    } else if (timeframe === 'yearly') {
      for (let i = 0; i < 12; i++) {
        const monthStartDate = new Date(startDate.getFullYear(), i, 1);
        const monthEndDate = new Date(startDate.getFullYear(), i + 1, 1);
        const monthSales = orders.filter(order => order.date >= monthStartDate && order.date <= monthEndDate);
        const monthTotalSales = monthSales.reduce((total, order) => total + order.totalPrice, 0);
        salesData[monthStartDate.toISOString()] = monthTotalSales;
      }
    }
    orders.forEach(order => {
      const date = formatDate(order.date);
      salesData[date] += order.totalPrice;
    });

    const labels = Object.keys(salesData).map(date => formatDate(new Date(date)));
    const values = Object.values(salesData);

    sendSuccess(res, {
      data: { labels, values }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};




module.exports = {
  adminLogin,
  adminValidation,
  adminPanel,
  adminLogout,
  users,
  updateUser,
  fetchDashboard,
  generateReport,
  // report,
  bestProducts,
  bestCategories,
  bestBrands,
  sales
}