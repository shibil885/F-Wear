const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const saltRound = 10
const OTP = require('../models/otpmodel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')
const Wallet = require('../models/walletModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')

//rendering home page
const homePage = async (req, res) => {
    try {
        const userData = req.session.user;
        if (userData) {
            const userCart = await Cart.findOne({ userID: req.session.userID });
            const cartLength = userCart ? userCart.items.length : 0;
            res.render('user/home', { userData, cartLength });
        } else {
            res.render('user/home', { userData: null, cartLength: 0 });
        }
    } catch (error) {
        console.error('Error occurred while rendering home page', error);
        res.status(500).send('Internal Server Error');
    }
}
const about = async (req, res) => {
    try {
        const userData = req.session.user;
        if (userData) {
            const userCart = await Cart.findOne({ userID: req.session.userID });
            const cartLength = userCart ? userCart.items.length : 0;
            res.render('user/about', { userData, cartLength });
        }else{
            const userCart = await Cart.findOne({ userID: req.session.userID });
            const cartLength = userCart ? userCart.items.length : 0;
            res.render('user/about', { userData, cartLength });
        }
    } catch (error) {
        console.error('Error occurred while rendering home page', error);
        res.status(500).send('Internal Server Error');
    }
}
const services = async (req, res) => {
    try {
        const userData = req.session.user;
        if (userData) {
            const userCart = await Cart.findOne({ userID: req.session.userID });
            const cartLength = userCart ? userCart.items.length : 0;
            res.render('user/services', { userData, cartLength });
        }else{
            const userCart = await Cart.findOne({ userID: req.session.userID });
            const cartLength = userCart ? userCart.items.length : 0;
            res.render('user/services', { userData, cartLength });
        }
    } catch (error) {
        console.error('Error occurred while rendering home page', error);
        res.status(500).send('Internal Server Error');
    }
}

//rendering Login page
const userLoginPage = (req, res) => {
    res.render('user/userLogin')
}

//user login
const login = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.body.email });
        if (!userData) {
            res.render('user/userLogin', { alert: 'Entered email or password is incorrect' });
        } else if (userData.isBlocked) {
            res.render('user/userLogin', { alert: 'This account is temporarily restricted' });
        } else {
            const passwordMatch = await bcrypt.compare(req.body.password, userData.password);
            if (passwordMatch && userData.email === req.body.email) {
                req.session.user = userData;
                req.session.userID = userData._id;
                req.session.isLogged = true;
                res.redirect('/');
            } else {
                res.render('user/userLogin', { alert: 'Entered email or password is incorrect' });
            }
        }
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }
}
//rendering signup page
const userSignup = ((req, res) => {
    try {
        res.render('user/userSignup')
    } catch (error) {
        console.error('Erorr occur while render userSignup page', error)
    }

})

const userValidation = async (req, res) => {
    try {
        const response = await OTP.find({ email: req.session.userDetails.email }).sort({ createdAt: -1 }).limit(1);
        if (response.length === 0 || response[0]?.otp !== req.body.otp) {
            return res.render('user/otpGetPage', { otpAlert: 'invalid otp' });
        } else {
            const hashedPassword = await bcrypt.hash(req.session.userDetails.password, saltRound);

            const user = new User({
                username: req.session.userDetails.username,
                email: req.session.userDetails.email,
                phone: req.session.userDetails.phone,
                password: hashedPassword
            });
            await user.save();
            
            const userData = await User.findOne({email:req.session.userDetails.email})
            const wallet = new Wallet({
                userId:userData._id,
                balance:0
            })
            await wallet.save()
            const cart = new Cart({
                userID:userData._id,
                items:[],
                totalPrice:0
            })
            await cart.save()
            const wishList = new Wishlist({
                userID:userData._id,
                items:[]
            })
            await wishList.save()
            return res.redirect('/userLogin');
        }
    } catch (error) {
        console.error('Erorr occur while save user to db', error.message);
    }
};
const userLogout = async (req, res,next) => {
    try {
        req.session.user = null
        req.session.isLogged = false
        req.session.userID = null
        res.redirect('/')
    } catch (error) {
        next(error)
    }
}

const shop = async (req, res, next) => {
    try {
      const ProductData = await Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brandId',
            foreignField: '_id',
            as: 'brand'
          }
        },
        {
          $match: {
            $and: [
              { 'category.isList': true },
              { 'brand.isList': true }, 
              { isPublish: true }
            ]
          }
        }
      ]);
  
      const userData = req.session.user;
      if (userData) {
          const userCart = await Cart.findOne({ userID: req.session.userID });
          const cartLength = userCart ? userCart.items.length : 0;
          res.render('user/shop', { userData, cartLength,ProductData });
      }else{
          const userCart = await Cart.findOne({ userID: req.session.userID });
          const cartLength = userCart ? userCart.items.length : 0;
          res.render('user/shop', { userData, cartLength,ProductData });    
      }
    } catch (error) {
      next(error);
      console.error(error);
    }
  };
  
const userAccount = async (req, res) => {
    try {
        const id = req.session.userID
        const userData = await User.findById(id)
        const userAddress = await Address.findOne({ userID: id })
        const userOrder = await Order.find({ userId: id })
        const userCart = await Cart.findOne({ userID: id })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/userAccount', { userData, userAddress, userOrder,cartLength })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.error(error);
    }
}
const editProfile = async (req, res) => {
    try {
        const id = req.session.userID;
        const updatedUser = await User.findByIdAndUpdate(id, {
            email: req.body.email,
            username: req.body.username,
            phone: req.body.phone
        });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log('Updated user:', updatedUser);
        res.redirect('/userAccount')
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const changePasswordPage = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/changePassword',{cartLength})
    } catch (error) {
        console.error(error);
    }
}
const changePassword = async (req, res) => {
    try {
        const id = req.session.userID
        const userData = await User.findById(id)
        if(userData){
            const passwordMatch = await bcrypt.compare(req.body.currentPassword,userData.password)
            if(passwordMatch){
                const hashedPassword = await bcrypt.hash(req.body.password, saltRound);
                const changed = await User.findByIdAndUpdate(id, {
                    password: hashedPassword
                })
                res.redirect('/userAccount')
            }else{
                res.status(200).render('user/changePassword',{alert:"Current password does'nt match"})
            }
        }else{
           res.json({response:false,error:'somthing went wrong'})
        }
    } catch (error) {
        console.error(error);
    }
}
const favorite = async (req,res)=>{
    try {
        const userId = req.session.userID
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        const userWhishList = await Whishlist.findOne({ userID: userId }).populate('items.product')
        const cartLength = userCart ? userCart.items.length : 0;
        return res.render('user/whishList', { userWhishList, cartLength,userCart });
    } catch (error) {
        console.error('Error fetching userCart:', error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    homePage,
    about,
    userLoginPage,
    login,
    userSignup,
    shop,
    userValidation,
    userLogout,
    userAccount,
    editProfile,
    changePasswordPage,
    changePassword,
    favorite,
    services
}
