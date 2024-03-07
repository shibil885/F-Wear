const Coupon = require('../models/couponModel')
const Cart = require('../models/cartModel')

const couponList = async (req, res) => {
    try {
        const perPage = 8;
        const page = req.query.page || 1;

        const totalCoupons = await Coupon.countDocuments();

        const coupon = await Coupon.find()
            .skip(perPage * page - perPage)
            .limit(perPage);

        const totalPages = Math.ceil(totalCoupons / perPage);

        res.render('admin/coupon', {
            coupon,
            totalPages,
            currentPage: page,
            perPage
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const addCouponPage = async(req,res)=>{
    try {
      res.status(200).render('admin/addCoupon')  
    } catch (error) {
        console.error(error);
    }
}


const addCoupon = async(req,res)=>{
    try {
        const {coupon_code,description,percentage,min_amount,max_amount,expiry_date}=req.body
        const existCoupon = await Coupon.findOne({coupon_code:coupon_code})
        console.log(req.body);
        if(existCoupon){
            return res.status(200).render('admin/addCoupon',{alert:'The Coupon already exists'})
        }
         const newCoupon = new Coupon({
            coupon_code:coupon_code,
            description:description,
            percentage:percentage,
            minimumAmount:min_amount,
            maximumAmount:max_amount,
            expiryDate:expiry_date
         })
         await newCoupon.save()
         console.log('new coupon added:',newCoupon);
         res.redirect('/couponList')
    } catch (error) {
        console.error(error);
    }
}
const editCouponPage = async (req,res)=>{
    try {
        const couponId  =req.query.couponId
        const coupon = await Coupon.findById(couponId)
        res.status(200).render('admin/editCoupon',{coupon})
    } catch (error) {
        console.error(error);
        res.status(500).json({error:'Internal server error'})
    }
}
const editCoupon = async (req, res) => {
    try {
        const { coupon_code, description, percentage, min_amount, max_amount, expiry_date } = req.body;
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);
        const existingCoupon = await Coupon.findOne({ 
            coupon_code: coupon_code,
            description: description,
            percentage: percentage,
            minimumAmount: min_amount,
            maximumAmount: max_amount,
            expiryDate: expiry_date
        });

        if (existingCoupon) {
            return res.status(400).render('admin/editCoupon', { alert: 'A coupon with the same details already exists' ,coupon});
        }
        coupon.coupon_code = coupon_code;
        coupon.description = description;
        coupon.percentage = percentage;
        coupon.minimumAmount = min_amount;
        coupon.maximumAmount = max_amount;
        coupon.expiryDate = expiry_date;
        await coupon.save();

        res.redirect('/couponList');
        
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}

const checkCoupon = async(req,res)=>{
    try {
        const couponId = req.body.couponId
        const userCart = await Cart.findOne({userID:req.session.userID})
        const totalAmount = userCart.totalPrice + 50
        const selectedCoupon = await Coupon.findById(couponId)
        const amountDividedBYPercentage = Math.ceil(totalAmount*selectedCoupon.percentage/100)
        if(amountDividedBYPercentage > selectedCoupon.maximumAmount ){
            const amountToPay = totalAmount - selectedCoupon.maximumAmount
            res.json({totalAmount:amountToPay,couponId:couponId,discountAmount:selectedCoupon.maximumAmount,couponCode:selectedCoupon.coupon_code})   
        }else{
            const amountToPay = totalAmount-amountDividedBYPercentage
            res.json({totalAmount:amountToPay,couponId:couponId,discountAmount:amountDividedBYPercentage,couponCode:selectedCoupon.coupon_code})
        }
    } catch (error) {
        console.error(error);
    }
}
const listCoupon = async(req,res)=>{
    try {
        const couponId = req.body.couponId
        await Coupon.updateOne({_id:couponId},{
            isListed:true
        })
        res.json({success:true})
    } catch (error) {
        console.error(error);
    }
}
const UnListCoupon = async(req,res)=>{
    try {
        const couponId = req.body.couponId
        await Coupon.updateOne({_id:couponId},{
            isListed:false
        })
        res.json({success:true})
    } catch (error) {
        console.error(error);
    }
}
module.exports = {
    couponList,
    addCouponPage,
    addCoupon,
    editCouponPage,
    editCoupon,
    checkCoupon,
    listCoupon,
    UnListCoupon
}