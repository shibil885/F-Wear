const express = require('express')
const admin_router = express.Router()

//controllers
const adminController = require('../controllers/adminController')
const { isAdmin, isLoggedAdmin } = require('../middleware/adminAuth')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const brandController = require('../controllers/brandController')


admin_router.post('/adminValidation', adminController.adminValidation)
admin_router.get('/adminPanel', isAdmin, adminController.adminPanel)
admin_router.get('/adminLogout', isAdmin, adminController.adminLogout)
admin_router.get('/adminLogin', isLoggedAdmin, adminController.adminLogin)

admin_router.post('/generate-report', isAdmin, adminController.generateReport)


admin_router.get('/fetchdashboard', isAdmin, adminController.fetchDashboard)
admin_router.get('/sales', isAdmin, adminController.sales)


/*     ------USERS-----     */
admin_router.get('/users', isAdmin, adminController.users)
admin_router.patch('/users/:id', isAdmin, adminController.updateUser);


/*     -----PRODUCTS-----     */
admin_router.get('/product', isAdmin, productController.productList)
admin_router.post('/product', isAdmin, productController.addProduct)
admin_router.get('/product/new', isAdmin, productController.addProductPage)
admin_router.patch('/product/:id', isAdmin, productController.updatePublishStatus);
admin_router.get('product/edit/:id', isAdmin, productController.editProductPage)
admin_router.post('/product/edit/:id', isAdmin, productController.editProduct)


/*     -----CATEGORIES-----     */
admin_router.get('/category', isAdmin, categoryController.categories)
admin_router.post('/category', isAdmin, categoryController.addCategory)
admin_router.get('/category/new', isAdmin, categoryController.addCategoriesPage)
admin_router.patch('/category/:id', isAdmin, categoryController.updateCategoryListStatus);
admin_router.get('/category/edit/:id', isAdmin, categoryController.editCategoryPage)
admin_router.post('/category/edit/:id', isAdmin, categoryController.editCategory)

/*     -----BRANDS-----     */
admin_router.get('/brand', isAdmin, brandController.brandList)
admin_router.post('/brand', isAdmin, brandController.addBrand)
admin_router.get('/brand/new', isAdmin, brandController.addBrandPage)
admin_router.patch('/brand/:id', isAdmin, brandController.updateBrandListStatus);
admin_router.get('/brand/edit/:id', isAdmin, brandController.editBrandPage)
admin_router.post('/brand/edit/:id', isAdmin, brandController.editBrand)


/*     -----COUPONS-----     */
admin_router.get('/coupon', isAdmin, couponController.couponList);
admin_router.get('/coupon/new', isAdmin, couponController.addCouponPage);
admin_router.post('/coupon', isAdmin, couponController.addCoupon);
admin_router.get('/coupon/:couponId', isAdmin, couponController.editCouponPage);
admin_router.post('/coupon/:id', isAdmin, couponController.editCoupon);
admin_router.patch('/coupon/:id', isAdmin, couponController.toggleCouponStatus);



//////////////orders\\\\\\\\\\\\\\\\
admin_router.get('/orderlist', isAdmin, orderController.orderList)
admin_router.get('/userOrderDetails/:id', isAdmin, orderController.userOrderDetails)
admin_router.patch('/cancelOrderAdmin', isAdmin, orderController.cancelOrderAdmin)
admin_router.patch('/confirmOrder', isAdmin, orderController.confirmOrder)
admin_router.patch('/shippedOrder', isAdmin, orderController.shippedOrder)
admin_router.patch('/deliveredOrder', isAdmin, orderController.deliveredOrder)
admin_router.patch('/pendingOrder', isAdmin, orderController.pendingOrder)


//best
admin_router.get('/bestProducts', isAdmin, adminController.bestProducts)
admin_router.get('/bestCategories', isAdmin, adminController.bestCategories)
admin_router.get('/bestBrands', isAdmin, adminController.bestBrands)


module.exports = admin_router