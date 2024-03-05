const express = require('express')
const admin_router = express.Router()

//controllers
const adminController = require('../controllers/adminController')
const {isAdmin,isLoggedAdmin} = require('../middleware/adminAuth')
const categoryController  = require('../controllers/categoryController')
const productController  = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const brandController = require('../controllers/brandController')


admin_router.post('/adminValidation',adminController.adminValidation)
admin_router.get('/adminPanel',isAdmin,adminController.adminPanel)
admin_router.get('/adminLogout',isAdmin,adminController.adminLogout)
admin_router.get('/adminLogin',isLoggedAdmin,adminController.adminLogin)

admin_router.post('/generate-report',isAdmin,adminController.generateReport)


admin_router.get('/fetchdashboard',adminController.fetchDashboard)



                    ////////////////user\\\\\\\\\\\\\\\\
admin_router.get('/users',isAdmin,adminController.users)
admin_router.get('/block',isAdmin,adminController.blockUser);
admin_router.get('/unBlock',isAdmin,adminController.unBlockUser);





                    ///////////////Product\\\\\\\\\\\\\\\\
admin_router.get('/productList',isAdmin,productController.productList)
//admin_router.get('/productList/:page',isAdmin,productController.getProductsPagination)
admin_router.get('/addProductPage',isAdmin,productController.addProductPage)
admin_router.post('/addproducts',isAdmin,productController.addProduct)
admin_router.get('/unPublish',isAdmin,productController.unPublish)
admin_router.get('/publish',isAdmin,productController.publish)
admin_router.get('/editProductPage/:id',isAdmin,productController.editProductPage)
admin_router.post('/editProduct/:id',isAdmin,productController.editProduct)







                    //////////////orders\\\\\\\\\\\\\\\\
admin_router.get('/orderlist',isAdmin,orderController.orderList)
admin_router.get('/userOrderDetails/:id',isAdmin,orderController.userOrderDetails)
admin_router.patch('/cancelOrderAdmin',isAdmin,orderController.cancelOrderAdmin)
admin_router.patch('/confirmOrder',isAdmin,orderController.confirmOrder)
admin_router.patch('/shippedOrder',isAdmin,orderController.shippedOrder)
admin_router.patch('/deliveredOrder',isAdmin,orderController.deliveredOrder)
admin_router.patch('/pendingOrder',isAdmin,orderController.pendingOrder)







                //////////////Category\\\\\\\\\\\\\\\\
admin_router.get('/Categories',isAdmin,categoryController.Categories)
admin_router.get('/addCategories',isAdmin,categoryController.addCategoriesPage)
admin_router.post('/addCategory',isAdmin,categoryController.addCategory)
admin_router.get('/editCategory/:id',isAdmin,categoryController.editCategoryPage)
admin_router.post('/editCategory',isAdmin,categoryController.editCategory)
admin_router.patch('/unlistCategory/:id',isAdmin,categoryController.unlistCategory)
admin_router.patch('/listCategory/:id',isAdmin,categoryController.listCategory)

                //////////////Brand\\\\\\\\\\\\\\\\
admin_router.get('/brand',isAdmin,brandController.brandList)
admin_router.get('/addBrands',isAdmin,brandController.addBrandPage)
admin_router.post('/addBrand',isAdmin,brandController.addBrand)
admin_router.patch('/unListBrand/:id',isAdmin,brandController.unListBrand)
admin_router.patch('/listBrand/:id',isAdmin,brandController.listBrand)
admin_router.get('/editBrand/:id',isAdmin,brandController.editBrandPage)
admin_router.post('/editBrand',isAdmin,brandController.editBrand)




                //////////////Coupon\\\\\\\\\\\\\\\\
admin_router.get('/couponList',isAdmin,couponController.couponList)
admin_router.get('/addCoupon',isAdmin,couponController.addCouponPage)
admin_router.post('/addCoupon',isAdmin,couponController.addCoupon)
admin_router.get('/editCoupon',isAdmin,couponController.editCouponPage)
admin_router.post('/editCoupon/:id',isAdmin,couponController.editCoupon)


//best

admin_router.get('/bestProducts',isAdmin,adminController.bestProducts)
admin_router.get('/bestCategories',isAdmin,adminController.bestCategories)
admin_router.get('/bestBrands',isAdmin,adminController.bestBrands)


module.exports = admin_router