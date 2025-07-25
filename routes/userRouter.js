const express = require('express')
const user_router = express.Router()


//middleware
const { isUser, isLoggedUser, isBlocked } = require('../middleware/userAuth');
const validateObjectId = require('../middleware/validateObjectId');
// controllers
const cartController = require('../controllers/cartController')
const addressController = require('../controllers/addressController')
const orderController = require('../controllers/orderController')
const productController = require('../controllers/productController')
const userController = require('../controllers/userController')
const otpController = require('../controllers/otpController')
const walletController = require('../controllers/walletController')
const couponController = require('../controllers/couponController')
const wishListController = require('../controllers/wishlistController')
const { isValidObjectId } = require('mongoose')



user_router.get('/', userController.homePage)
user_router.get('/userLogin', isLoggedUser, userController.userLoginPage)
user_router.post('/login', isLoggedUser, userController.login)
user_router.get('/userSignup', isLoggedUser, userController.userSignup)
user_router.post('/signup', isLoggedUser, otpController.signup)
user_router.get('/userLogout', isUser, isBlocked, userController.userLogout)
user_router.get('/about', userController.about)
user_router.get('/services.html', userController.services)
//otp
user_router.post('/userValidation', isLoggedUser, userController.userValidation)
user_router.get('/resendotp', otpController.resendOtp)
//product
user_router.get('/shop', userController.shop)
user_router.get('/productDetails/:id',validateObjectId('id'), productController.productDetails)
//ac
user_router.get('/userAccount', isUser, isBlocked, userController.userAccount)
user_router.post('/editProfile', isUser, isBlocked, userController.editProfile)
user_router.get('/changePasswordPage', isUser, isBlocked, userController.changePasswordPage)
user_router.post('/changePassword', isUser, isBlocked, userController.changePassword)

/*    ----CART----    */
user_router.patch('/cart/:id', isUser, isBlocked,validateObjectId('id'), cartController.addToCart)
user_router.delete('/cart/:productId',validateObjectId('productId'), isUser, isBlocked, cartController.deleteCart);
user_router.get('/cartPage', isUser, isBlocked, cartController.cartPage)
user_router.post('/updateCart', isUser, isBlocked, cartController.updateCart)
user_router.get('/checkoutPage', isUser, isBlocked, cartController.checkoutPage)

/*    -----ADDRESS-----    */
user_router.get('/address', isUser, isBlocked, addressController.address);
user_router.get('/address/new', isUser, isBlocked, addressController.addAddressPage);
user_router.post('/address', isUser, isBlocked, addressController.addAddress);
user_router.post('/address/checkout', isUser, isBlocked, addressController.checkOutAddress);
user_router.get('/address/:id', isUser, isBlocked, validateObjectId('id'), addressController.editAddressPage);
user_router.post('/address/:id', isUser, isBlocked, validateObjectId('id'), addressController.editAddress);
user_router.delete('/address/:id', isUser, isBlocked,validateObjectId('id'), addressController.deleteAddress);


//order
user_router.post('/orderPlacing', isUser, isBlocked, orderController.orderPlacing)
user_router.patch('/cashOnDelivery', isUser, isBlocked, orderController.cashOnDelivery)
user_router.patch('/razorPay', isUser, isBlocked, orderController.razorPay)
user_router.patch('/wallet', isUser, isBlocked, orderController.orderInWallet)
user_router.post('/failedOrder', isUser, isBlocked, orderController.failedOrder)
user_router.get('/payFailedAmount/:id', isUser, isBlocked,validateObjectId('id'), orderController.payFailedAmount)
user_router.post('/orderPlacingFailed/:id', isUser, isBlocked,validateObjectId('id'), orderController.orderPlacingFailed)
user_router.get('/thankYou', isUser, isBlocked, orderController.thankYou)
user_router.get('/orders', isUser, isBlocked, orderController.orders)
user_router.get('/orderDetails/:id', isBlocked,validateObjectId('id'), orderController.orderDetails)
user_router.patch('/cancelOrder', isUser, isBlocked, orderController.cancelOrder)
user_router.patch('/returnOrder', isUser, isBlocked, orderController.returnOrder)
user_router.get('/downloadInvoice/:id', isUser, isBlocked,validateObjectId('id'), orderController.downloadInvoice)
/*   ----WALLET----    */
user_router.get('/wallet', isUser, isBlocked, walletController.wallet)
user_router.post('/addAmount', isUser, isBlocked, walletController.addAmount)
//coupon
user_router.patch('/checkCoupon', isUser, isBlocked, couponController.checkCoupon)
/*    ----WHISHLIST----*/
user_router.get('/wishlist', isUser, isBlocked, wishListController.favorite)
user_router.patch('/wishlist/:id', isUser, isBlocked,validateObjectId('id'), wishListController.addToWishList)
user_router.delete('/whishlist/:id', isUser, isBlocked,validateObjectId('id'), wishListController.deleteWishList)





module.exports = user_router