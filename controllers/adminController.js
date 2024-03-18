const User = require('../models/userModel')
const Category = require('../models/categoriesModel')
const Products = require('../models/productModel')
const Orders = require('../models/orderModel')
const pdf = require('html-pdf')
const PDFDocument = require('pdfkit');
const fs = require('fs')
require('dotenv').config()


async function chart() {
  try {
    const ordersPie = await Orders.find()
    const ordersCount = {
      cashOnDelivery: 0,
      razorPay: 0,
      wallet: 0
    }
    const paymentMethod = {
      cashOnDelivery:'cashOnDelivery',
      razorPay:'razorPay',
      wallet :'wallet'
    }
    ordersPie.forEach((order) => {
      if (order.paymentMethod === paymentMethod.cashOnDelivery) {
        ordersCount.cashOnDelivery++
      } else if (order.paymentMethod === "razorPay") {
        ordersCount.razorPay++
      } else if (order.paymentMethod === "wallet") {
        ordersCount.wallet++
      }
    })

    return ordersCount;
  } catch (error) {
    console.log("An error occured in orders count function chart", error.message);
  }
}

async function monthgraph() {
  try {
    const ordersCountByMonth = await Orders.aggregate([
      {
        $project: {
          yearMonth: {
            $dateToString: {
              format: "%Y-%m",
              date: "$date"
            }
          }
        }
      },
      {
        $group: {
          _id: "$yearMonth",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const labels = ordersCountByMonth.map(val => val._id);
    const count = ordersCountByMonth.map(val => val.count);
    return {
      labels: labels,
      count: count
    };
  } catch (error) {
    console.log('Error retrieving orders in monthgraph function:', error.message);
    throw error;
  }
}

async function yeargraph() {
  try {
    const ordersCountByYear = await Orders.aggregate([
      {
        $project: {
          year: { $year: { date: '$date' } },
        },
      },
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const labels = ordersCountByYear.map((val) => val._id.toString());
    const count = ordersCountByYear.map((val) => val.count);

    return {
      labels: labels,
      count: count
    };
  } catch (error) {
    console.log('Error retrieving orders in yeargraph function:', error.message);
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
      res.render('admin/adminLogin', { alert: 'email or password is invalid' })
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
    const orders = await Orders.find()
    const categories = await Category.find()
    const ordersPie = await chart()
    const ordersGraph = await monthgraph();
    const ordersYearGraph = await yeargraph();

    let totalOrderPrice = 0;
    orders.forEach(order => {
      totalOrderPrice += order.totalPrice || 0;
    });

    res.render("admin/adminPanel", { users: users, orders: orders, products: products, ordersPie: ordersPie, categories: categories, ordersGraph, ordersYearGraph, totalOrderPrice });
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
// const blockUser = async (req,res,next)=>{
//     try {
//         const id =req.query.id
//         await User.findByIdAndUpdate(id,{isBlocked:true})
//         req.session.isLogged = false
//         req.session.user = null
//         res.json({success:true})
//         console.log('blocked successfully',id);
//     } catch (error) {
//         next(error)
//     }
// }   
// const unBlockUser = async (req,res,next)=>{
//     try {
//         const id =req.query.id
//         await User.findByIdAndUpdate(id,{isBlocked:false})
//         req.session.isLogged = true
//         req.session.user = req.session.userDetails.email

//         res.json({success:true});
//         console.log('Unblocked successfully',id);
//     } catch (error) {
//         next(error)
//     }
// }   


//function to block and Unblock user
async function blockOrUnblock(req, res, status) {
  try {
    const id = req.query.id
    await User.findByIdAndUpdate(id, { isBlocked: status })
    res.status(200).json({ success: true })
  } catch (error) {
    console.error(error);
  }
}


const blockUser = async (req, res) => {
  try {
    req.session.isLogged = false
    return blockOrUnblock(req, res, true)

  } catch (error) {
    console.error(error);
  }
}


const unBlockUser = async (req, res) => {
  try {
    req.session.isLogged = true
    return blockOrUnblock(req, res, false)
  } catch (error) {
    console.error(error);
  }
}


const fetchDashboard = async (req, res, next) => {
  try {
    const users = await User.find().exec();
    const orders = await Orders.find().exec();
    const products = await Products.find().exec();
    const ordersPie = await chart();


    res.json({
      users: users,
      orders: orders,
      products: products,
      ordersPie: ordersPie,
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

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream('./temp/report.pdf');
    doc.pipe(writeStream);

    doc.fontSize(12).text('Order Details Report', { align: 'center' });
    doc.moveDown();
    doc.text(`Start Date: ${startDate}`);
    doc.text(`End Date: ${endDate}`);
    doc.moveDown();

    if (orders.length === 0) {
        doc.fontSize(24).fillColor('#666666').text('No records found', { align: 'center' });
    } else {
        orders.forEach(order => {
            const orderDetails = `Order ID: ${order._id}, Order Date: ${order.date.toDateString()}, Payment Status: ${order.paymentStatus}`;
            doc.text(orderDetails);
            order.products.forEach(item => {
                const itemDetails = `Product: ${item.productId.name}, Quantity: ${item.quantity}, Price: ${item.price}`;
                doc.text(itemDetails);
            });

            doc.moveDown();
        });
    }

    doc.end();

    res.json({ reportUrl: './temp/report.pdf' });
} catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
}
}
const report = (req, res) => {
  const filePath = '../temp/report.pdf';
  res.sendFile(filePath, { root: '.' }, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(404).send('File not found');
    }
  });
}

const bestProducts = async (req, res) => {
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

    console.log('bestSellingProducts:', bestSellingProducts);
    res.status(200).render('admin/bestProducts', { bestSellingProducts })
  } catch (error) {
    console.error(error);
  }
}
const bestCategories = async (req, res) => {
  try {
    const bestSellingCategories = await Orders.aggregate([
      // Unwind the products array to denormalize it
      { $unwind: '$products' },
      // Perform a lookup to get product details including category
      {
        $lookup: {
          from: 'productmodels', // Collection name for products
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      // Unwind the product array created by the lookup
      { $unwind: '$product' },
      // Group by category and sum up the quantities
      {
        $group: {
          _id: '$product.categoryId', // Group by category ID
          totalQuantity: { $sum: '$products.quantity' }, // Calculate total quantity for each category
        },
      },
      // Sort by total quantity in descending order
      { $sort: { totalQuantity: -1 } },
      // Limit to the top 10 categories
      { $limit: 10 },
      // Perform a lookup to get category details based on the category ID
      {
        $lookup: {
          from: 'categories', // Collection name for categories
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      // Unwind the category array created by the lookup
      { $unwind: '$category' },
      // Project the fields to include in the output
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
    console.error(error);
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
          _id: '$product.brandId', // Use brandId from the product schema
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
          _id: '$_id', // Keep the _id unchanged
          brandName: '$brand.name', // Use the correct field name for brand name
          totalQuantity: 1,
        },
      },
    ]);
    res.render('admin/bestbrand', { bestSellingBrands });
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
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
    } else if (timeframe === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date();
    } else if (timeframe === 'yearly') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      endDate = new Date();
    } else {
      return res.status(400).json({ error: 'Invalid timeframe' });
    }

    const orders = await Orders.find({
      date: { $gte: startDate, $lte: endDate },
      paymentStatus: 'paid'
    });
    const salesData = {};
    orders.forEach(order => {
      const date = formatDate(order.date);
      salesData[date] = salesData[date] ? salesData[date] + order.totalPrice : order.totalPrice;
    });

    const labels = Object.keys(salesData);
    const values = Object.values(salesData);
    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  adminLogin,
  adminValidation,
  adminPanel,
  adminLogout,
  users,
  blockUser,
  unBlockUser,
  fetchDashboard,
  generateReport,
  report,
  bestProducts,
  bestCategories,
  bestBrands,
  sales
}