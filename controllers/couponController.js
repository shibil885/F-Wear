const Coupon = require('../models/couponModel')
const Cart = require('../models/cartModel')
const { sendSuccess, sendError, MESSAGES, STATUS_CODES, COMMON_MESSAGES } = require('../util')

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
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const addCouponPage = async (req, res) => {
    try {
        res.status(STATUS_CODES.OK).render('admin/addCoupon')
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const addCoupon = async (req, res) => {
    try {
        const { coupon_code, description, percentage, min_amount, max_amount, expiry_date } = req.body
        const existCoupon = await Coupon.findOne({ coupon_code: coupon_code })
        if (existCoupon) {
            return res.status(STATUS_CODES.OK).render('admin/addCoupon', { alert: MESSAGES.coupon.COUPON_EXISTS })
        }
        const newCoupon = new Coupon({
            coupon_code: coupon_code,
            description: description,
            percentage: percentage,
            minimumAmount: min_amount,
            maximumAmount: max_amount,
            expiryDate: expiry_date
        })
        await newCoupon.save()
        res.redirect('/coupon')
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const editCouponPage = async (req, res) => {
    try {
        const couponId = req.params.couponId
        const coupon = await Coupon.findById(couponId)
        res.status(STATUS_CODES.OK).render('admin/editCoupon', { coupon })
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
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
            return res.status(STATUS_CODES.BAD_REQUEST).render('admin/editCoupon', { alert: MESSAGES.coupon.COUPON_DUPLICATE, coupon });
        }
        coupon.coupon_code = coupon_code;
        coupon.description = description;
        coupon.percentage = percentage;
        coupon.minimumAmount = min_amount;
        coupon.maximumAmount = max_amount;
        coupon.expiryDate = expiry_date;
        await coupon.save();

        res.redirect('/coupon');

    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const checkCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const totalAmount = userCart.totalPrice + 50
        const selectedCoupon = await Coupon.findById(couponId)
        const amountDividedBYPercentage = Math.ceil(totalAmount * selectedCoupon.percentage / 100)
        if (amountDividedBYPercentage > selectedCoupon.maximumAmount) {
            const amountToPay = totalAmount - selectedCoupon.maximumAmount
            return sendSuccess(res, {
                data: {
                    totalAmount: amountToPay,
                    couponId: couponId,
                    discountAmount: selectedCoupon.maximumAmount,
                    couponCode: selectedCoupon.coupon_code
                }
            });
        } else {
            const amountToPay = totalAmount - amountDividedBYPercentage
            return sendSuccess(res, {
                data: {
                    totalAmount: amountToPay,
                    couponId: couponId,
                    discountAmount: amountDividedBYPercentage,
                    couponCode: selectedCoupon.coupon_code
                }
            });
        }
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const toggleCouponStatus = async (req, res) => {
    try {
        const couponId = req.params.id;
        const { isListed } = req.body;

        if (!couponId) {
            return sendError(res, { message: MESSAGES.coupon.COUPON_ID_REQUIRED, status: STATUS_CODES.BAD_REQUEST });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            { isListed },
            { new: true }
        );

        if (!updatedCoupon) {
            return sendError(res, { message: MESSAGES.coupon.COUPON_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }

        sendSuccess(res, {
            message: `Coupon has been ${isListed ? 'listed' : 'unlisted'} successfully`,
            data: { coupon: updatedCoupon }
        });

    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

module.exports = {
    couponList,
    addCouponPage,
    addCoupon,
    editCouponPage,
    editCoupon,
    checkCoupon,
    toggleCouponStatus,
}