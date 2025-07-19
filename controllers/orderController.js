const Order = require('../models/orderModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Product = require('../models/productModel')
const Wallet = require('../models/walletModel')
const Coupon = require('../models/couponModel')
const easyinvoice = require('easyinvoice');
const fs = require('fs');
const Razorpay = require('razorpay')
const path = require('path')
const { sendSuccess, sendError, MESSAGES, STATUS_CODES, COMMON_MESSAGES } = require('../util')

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
const razorPay = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.userID });
        const couponId = req.body.couponId;

        let totalAmount = userCart.totalPrice + 50;
        if (couponId) {
            const selectedCoupon = await Coupon.findById(couponId);
            const amountDividedBYPercentage = Math.ceil(totalAmount * selectedCoupon.percentage / 100);
            totalAmount = Math.max(amountDividedBYPercentage, totalAmount - selectedCoupon.maximumAmount);
        }
        const paymentData = {
            amount: totalAmount * 100,
            currency: 'INR',
            receipt: 'receipt_order_123',
            payment_capture: 1
        };
        const response = await razorpay.orders.create(paymentData);
        res.json(response);
    } catch (error) {
        console.log('error in razorpay pathc', error);
        res.status(STATUS_CODES.INTERNAL_ERROR).json({ error: 'Failed to create Razorpay order' });
    }
};


const orderPlacing = async (req, res) => {
    try {
        const userId = req.session.userID;
        const selectedaddress = req.body.selectedAddress;
        const couponId = req.body.couponId;
        console.log('req.body', req.body);
        if (!userId || !selectedaddress) {
            return sendError(res, { message: COMMON_MESSAGES.SOMETHING_WENT_WRONG, status: STATUS_CODES.BAD_REQUEST });
        }

        const userAddress = await Address.findOne({ userID: userId });
        console.log('userAddress:', userAddress);
        if (!userAddress || !userAddress.details || userAddress.details.length === 0) {
            return sendError(res, { message: "No address found for user", status: STATUS_CODES.BAD_REQUEST });
        }

        const userCart = await Cart.findOne({ userID: userId }).populate('items.product');
        if (!userCart || !userCart.items || userCart.items.length === 0) {
            return sendError(res, { message: "Cart is empty", status: STATUS_CODES.BAD_REQUEST });
        }

        let totalAmount = userCart.totalPrice + 50;
        const { items } = userCart;
        const selectedAddress = userAddress.details.find((address) => address._id.toString() === selectedaddress);
        if (!selectedAddress) {
            return sendError(res, { message: "Selected address not found", status: STATUS_CODES.BAD_REQUEST });
        }

        if (couponId) {
            const selectedCoupon = await Coupon.findById(couponId);
            if (!selectedCoupon) {
                return sendError(res, { message: "Coupon not found", status: STATUS_CODES.BAD_REQUEST });
            }
            const amountDividedBYPercentage = Math.ceil(totalAmount * selectedCoupon.percentage / 100);
            if (amountDividedBYPercentage > selectedCoupon.maximumAmount) {
                totalAmount = totalAmount - selectedCoupon.maximumAmount;
            } else {
                totalAmount = amountDividedBYPercentage;
            }
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'razorPay',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                paymentStatus: 'paid',
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
            await Coupon.updateOne({ _id: couponId }, {
                $push: { userID: req.session.userID }
            });
            return sendSuccess(res, { message: "Order placed successfully", data: { orderId: newOrder._id } });
        } else {
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'razorPay',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                paymentStatus: 'paid',
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
            return sendSuccess(res, { message: "Order placed successfully", data: { orderId: newOrder._id } });
        }
    } catch (error) {
        console.log('order place err:', error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}
const orderInWallet = async (req, res) => {
    try {
        const userId = req.session.userID;
        const selectedaddress = req.body.selectedAddress;
        const userWallet = await Wallet.findOne({ userId: userId })
        const walletAmount = userWallet.balance
        const couponId = req.body.couponId
        const userAddress = await Address.findOne({ userID: userId });
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        let totalAmount = userCart.totalPrice + 50
        if (walletAmount < totalAmount) {
            return res.json({ success: false, text: 'Not enough money in wallet', icon: 'warning' })
        }
        const { items } = userCart;
        const selectedAddress = userAddress.details.find((address) => address._id.toString() === selectedaddress);
        if (couponId) {
            const selectedCoupon = await Coupon.findById(couponId)
            const amountDividedBYPercentage = Math.ceil(totalAmount * selectedCoupon.percentage / 100)
            if (amountDividedBYPercentage > selectedCoupon.maximumAmount) {
                totalAmount = totalAmount - selectedCoupon.maximumAmount
            } else {
                totalAmount = amountDividedBYPercentage
            }
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'wallet',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                paymentStatus: 'paid',
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
            await Coupon.updateOne({ _id: couponId }, {
                $push: { userID: req.session.userID }
            })
            return res.json({ success: true })
        } else {
            const userId = req.session.userID;
            const selectedaddress = req.body.selectedAddress;
            const userAddress = await Address.findOne({ userID: userId });
            const userWallet = await Wallet.findOne({ userId: userId })
            const walletAmount = userWallet.balance
            const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
            let totalAmount = userCart.totalPrice + 50
            if (walletAmount < totalAmount) {
                return res.json({ success: false, text: 'Not enough money in wallet', icon: 'warning' })
            }
            const { items } = userCart;
            const selectedAddress = userAddress.details.find((address) => address._id.toString() === selectedaddress);
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'wallet',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                paymentStatus: 'paid',
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
            userWallet.balance -= parseInt(totalAmount);
            userWallet.history.push({
                amount: parseInt(totalAmount),
                type: 'debit',
                description: 'Amount paid to order'
            });
            await userWallet.save();
            return res.json({ success: true })
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
const cashOnDelivery = async (req, res) => {
    try {
        const userId = req.session.userID;
        const selectedaddress = req.body.selectedAddress;
        const couponId = req.body.couponId
        const userAddress = await Address.findOne({ userID: userId });
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        let totalAmount = userCart.totalPrice + 50
        const { items } = userCart;
        const selectedAddress = userAddress.details.find((address) => address._id.toString() === selectedaddress);
        if (couponId) {
            const selectedCoupon = await Coupon.findById(couponId)
            const amountDividedBYPercentage = Math.ceil(totalAmount * selectedCoupon.percentage / 100)
            if (amountDividedBYPercentage > selectedCoupon.maximumAmount) {
                totalAmount = totalAmount - selectedCoupon.maximumAmount
            } else {
                totalAmount = amountDividedBYPercentage
            }
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'cashOnDelivery',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
            await Coupon.updateOne({ _id: couponId }, {
                $push: { userID: req.session.userID }
            })
        } else {
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'cashOnDelivery',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
        }
        res.json({ success: true })
    } catch (error) {
        console.error(error);
    }
}
const failedOrder = async (req, res) => {
    try {
        const userId = req.session.userID;
        const selectedaddress = req.body.selectedAddress;
        const couponId = req.body.couponId
        const userAddress = await Address.findOne({ userID: userId });
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        let totalAmount = userCart.totalPrice + 50
        const { items } = userCart;
        const selectedAddress = userAddress.details.find((address) => address._id.toString() === selectedaddress);
        if (couponId) {
            const selectedCoupon = await Coupon.findById(couponId)
            const amountDividedBYPercentage = Math.ceil(totalAmount * selectedCoupon.percentage / 100)
            if (amountDividedBYPercentage > selectedCoupon.maximumAmount) {
                totalAmount = totalAmount - selectedCoupon.maximumAmount
            } else {
                totalAmount = amountDividedBYPercentage
            }
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'razorPay',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                paymentStatus: 'failed',
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            console.log("Order saved successfully", newOrder);
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
            await Coupon.updateOne({ _id: couponId }, {
                $push: { userID: req.session.userID }
            })
        } else {
            const userId = req.session.userID;
            const selectedaddress = req.body.selectedAddress;
            const couponId = req.body.couponId
            const userAddress = await Address.findOne({ userID: userId });
            const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
            let totalAmount = userCart.totalPrice + 50
            const { items } = userCart;
            const selectedAddress = userAddress.details.find((address) => address._id.toString() === selectedaddress);
            const newOrder = new Order({
                userId: userId,
                totalPrice: totalAmount,
                paymentMethod: 'razorPay',
                address: selectedAddress.address,
                phoneNumber: selectedAddress.phone,
                pincode: selectedAddress.pincode,
                state: selectedAddress.state,
                country: selectedAddress.country,
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                paymentStatus: 'failed',
                products: items.map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                    salesPrice: item.price,
                    total: (item.price * item.quantity),
                })),
            });
            await newOrder.save();
            console.log("Order saved successfully", newOrder);
            await Cart.findOneAndUpdate(
                { userID: userId },
                { $set: { items: [], totalPrice: 0 } }
            );
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
const thankYou = (req, res) => {
    try {
        res.status(200).render('user/thankYou')
    } catch (error) {

    }
}
const payFailedAmount = async (req, res) => {
    try {
        const orderId = req.params.id
        const userOrder = await Order.findById(orderId).populate('products.productId');
        res.render('user/failedPay', { user: req.session.user, userOrder, orderId })
    } catch (error) {
        console.error(error);
    }
}
const orderPlacingFailed = async (req, res) => {
    try {
        const orderId = req.params.id
        const updateOrder = await Order.findById(orderId)
        const paymentStatus = updateOrder.paymentStatus = 'paid'
        await updateOrder.save()
    } catch (error) {
        console.error(error);
    }
}

const orderList = async (req, res) => {
    try {
        const perPage = 8;
        const page = req.query.page || 1;

        const totalOrders = await Order.countDocuments();

        const userOrders = await Order.find()
            .populate('userId')
            .sort({ date: -1 })
            .skip(perPage * page - perPage)
            .limit(perPage);

        const totalPages = Math.ceil(totalOrders / perPage);

        res.render('admin/orderList', {
            userOrder: userOrders,
            totalPages: totalPages,
            currentPage: page,
            perPage: perPage
        });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const userOrderDetails = async (req, res) => {
    try {
        try {
            const orderId = req.params.id
            const order = await Order.findOne({ _id: orderId }).populate('userId').populate('products.productId')
            res.render('admin/userOrderDetails', { order });
        } catch (error) {
            sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
        }
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.id
        const order = await Order.findById(orderId).populate('userId').populate('products.productId')
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/orderDetails', { order, cartLength });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const orders = async (req, res) => {
    try {
        const userid = req.session.userID;
        const perPage = 8;
        const page = req.query.page || 1;

        const totalOrders = await Order.countDocuments({ userId: userid });

        const orders = await Order.find({ userId: userid })
            .populate('userId')
            .sort({ date: -1 })
            .skip(perPage * page - perPage)
            .limit(perPage);

        const userCart = await Cart.findOne({ userID: userid });
        const cartLength = userCart ? userCart.items.length : 0;

        const totalPages = Math.ceil(totalOrders / perPage);

        res.render('user/orders', {
            orders,
            cartLength,
            totalPages,
            currentPage: page,
            perPage
        });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        const order = await Order.findOne({ _id: orderId })
        const cancelProduct = order.products.find(product => product.productId.toString() === productId);
        if (!cancelProduct) {
            return sendError(res, { message: MESSAGES.order.PRODUCT_NOT_FOUND_IN_ORDER, status: STATUS_CODES.NOT_FOUND });
        }
        if (order.paymentMethod === 'razorPay' || order.paymentMethod === 'wallet') {
            cancelProduct.status = 'cancelled';
            await Product.findByIdAndUpdate(cancelProduct.productId, { $inc: { stock: cancelProduct.quantity } });
            await order.save();
            const userWallet = await Wallet.findOne({ userId: req.session.userID })
            const amountToWallet = cancelProduct.total + 50
            userWallet.balance += amountToWallet
            userWallet.history.push({
                amount: amountToWallet,
                type: 'credit',
                description: 'Amount from order cancellation'
            });
            await userWallet.save();
            return sendSuccess(res, { message: MESSAGES.order.PRODUCT_CANCELLED, data: { cancelledProduct: cancelProduct } });
        }
        cancelProduct.status = 'cancelled';
        order.totalPrice -= cancelProduct.total;
        await Product.findByIdAndUpdate(cancelProduct.productId, { $inc: { stock: cancelProduct.quantity } });
        await order.save();
        sendSuccess(res, { message: MESSAGES.order.PRODUCT_CANCELLED, data: { cancelledProduct: cancelProduct } });
    } catch (error) {
        console.error(error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const returnOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        const order = await Order.findOne({ _id: orderId })
        if (order.paymentMethod === 'razorPay' || order.paymentMethod === 'wallet') {
            const returnProduct = order.products.find(product => product.productId.toString() === productId);
            if (!returnProduct) {
                return sendError(res, { message: MESSAGES.order.PRODUCT_NOT_FOUND_IN_ORDER, status: STATUS_CODES.NOT_FOUND });
            }
            returnProduct.status = 'return';
            returnProduct.isDelivered = false;
            order.totalPrice -= returnProduct.total;
            await Product.findByIdAndUpdate(returnProduct.productId, { $inc: { stock: returnProduct.quantity } });
            const unReturn = order.products.filter((product) => product.status !== 'return')
            if (unReturn.length == 0) {
                order.totalPrice = 0
            }
            await order.save();
            const userWallet = await Wallet.findOne({ userId: req.session.userID })
            const amountToWallet = returnProduct.total + 50
            userWallet.balance += amountToWallet
            userWallet.history.push({
                amount: amountToWallet,
                type: 'credit',
                description: 'Amount from order return'
            });
            await userWallet.save();
            return sendSuccess(res, { message: MESSAGES.order.PRODUCT_RETURNED, data: { returnProduct } });
        }
        const returnProduct = order.products.find(product => product.productId.toString() === productId);
        if (!returnProduct) {
            return sendError(res, { message: MESSAGES.order.PRODUCT_NOT_FOUND_IN_ORDER, status: STATUS_CODES.NOT_FOUND });
        }
        returnProduct.status = 'return';
        order.totalPrice -= returnProduct.total;
        await Product.findByIdAndUpdate(returnProduct.productId, { $inc: { stock: returnProduct.quantity } });
        const unReturn = order.products.filter((product) => product.status !== 'return')
        if (unReturn.length == 0) {
            order.totalPrice = 0
        }
        await order.save();
        sendSuccess(res, { message: MESSAGES.order.PRODUCT_RETURNED, data: { returnProduct } });
    } catch (error) {
        console.error(error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const cancelOrderAdmin = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        const order = await Order.findOne({ _id: orderId, 'products._id': productId });
        if (!order) {
            return sendError(res, { message: MESSAGES.order.ORDER_OR_PRODUCT_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }

        if (order.paymentMethod === 'razorPay' || order.paymentMethod === 'wallet') {
            const userId = order.userId
            const productIndex = order.products.findIndex(product => product._id.equals(productId));
            const cancelledProduct = order.products[productIndex];
            cancelledProduct.status = 'cancelled';
            await Product.findByIdAndUpdate(cancelledProduct.productId, { $inc: { stock: cancelledProduct.quantity } });
            await order.save();
            const userWallet = await Wallet.findOne({ userId: userId })
            const amountToWallet = cancelledProduct.total + 50
            userWallet.balance += amountToWallet
            userWallet.history.push({
                amount: amountToWallet,
                type: 'credit',
                description: 'Amount from order cancellation'
            });
            await userWallet.save();
            return sendSuccess(res, { message: MESSAGES.order.PRODUCT_CANCELLED, data: { order } });
        }
        const productIndex = order.products.findIndex(product => product._id.equals(productId));
        const cancelledProduct = order.products[productIndex];
        cancelledProduct.status = 'cancelled';
        await Product.findByIdAndUpdate(cancelledProduct.productId, { $inc: { stock: cancelledProduct.quantity } });
        await order.save();
        sendSuccess(res, { message: MESSAGES.order.PRODUCT_CANCELLED, data: { order } });
    } catch (error) {
        console.error(error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const confirmOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        const order = await Order.findOne({ _id: orderId, 'products._id': productId });
        if (!order) {
            return sendError(res, { message: MESSAGES.order.ORDER_OR_PRODUCT_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }
        const productIndex = order.products.findIndex(product => product._id.equals(productId));
        const cancelledProduct = order.products[productIndex];
        cancelledProduct.status = 'confirmed';
        await order.save();

        sendSuccess(res, { message: MESSAGES.order.PRODUCT_CONFIRMED, data: { order } });
    } catch (error) {
        console.error(error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const shippedOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        const order = await Order.findOne({ _id: orderId, 'products._id': productId });

        if (!order) {
            return sendError(res, { message: MESSAGES.order.ORDER_OR_PRODUCT_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }
        const productIndex = order.products.findIndex(product => product._id.equals(productId));

        const cancelledProduct = order.products[productIndex];
        cancelledProduct.status = 'shipped';
        await order.save();

        sendSuccess(res, { message: MESSAGES.order.PRODUCT_SHIPPED, data: { order } });
    } catch (error) {
        console.error(error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const deliveredOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        const order = await Order.findOne({ _id: orderId, 'products._id': productId });

        if (!order) {
            return sendError(res, { message: MESSAGES.order.ORDER_OR_PRODUCT_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }
        const productIndex = order.products.findIndex(product => product._id.equals(productId));

        const cancelledProduct = order.products[productIndex];
        cancelledProduct.status = 'delivered';
        cancelledProduct.isDelivered = 'true';
        await order.save();

        sendSuccess(res, { message: MESSAGES.order.PRODUCT_DELIVERED, data: { order } });
    } catch (error) {
        console.error(error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const pendingOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        const order = await Order.findOne({ _id: orderId, 'products._id': productId });

        if (!order) {
            return sendError(res, { message: MESSAGES.order.ORDER_OR_PRODUCT_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }
        const productIndex = order.products.findIndex(product => product._id.equals(productId));

        const cancelledProduct = order.products[productIndex];
        cancelledProduct.status = 'pending';
        order.totalPrice += cancelledProduct.total
        await order.save();

        sendSuccess(res, { message: MESSAGES.order.PRODUCT_SHIPPED, data: { order } });
    } catch (error) {
        console.error(error);
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return sendError(res, { message: MESSAGES.order.ORDER_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }
        const productsData = await Promise.all(order.products.map(async item => {
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new Error(`Product not found for ID: ${item.productId}`);
            }
            return {
                "quantity": item.quantity,
                "description": product.product_title,
                "tax": 0,
                "price": product.price
            };
        }));

        const data = {
            "currency": "INR",
            "taxNotation": "vat",
            "marginTop": 25,
            "marginRight": 25,
            "marginLeft": 25,
            "marginBottom": 25,
            "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
            "sender": {
                "company": ".f-Wear",
                "address": "Maradu Kochi",
                "zip": "680013",
                "city": "Kerala",
                "country": "India"
            },
            "client": {
                "company": order.firstName,
                "address": order.address,
                "zip": order.pincode,
                "city": order.state,
                "country": order.country
            },
            "invoiceDate": order.date.toISOString(),
            "products": productsData,
            "total": order.totalPrice + 50,
            "bottomNotice": `Total: ${order.totalPrice} INR`,
        };

        const result = await easyinvoice.createInvoice(data);

        const invoicesDir = path.join(__dirname, '..', 'invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir);
        }
        const filePath = path.join(invoicesDir, `invoice_${orderId}.pdf`);
        fs.writeFileSync(filePath, result.pdf, 'base64');
        res.download(filePath, `invoice_${orderId}.pdf`);
    } catch (err) {
        sendError(res, { message: MESSAGES.order.INVOICE_FAILED });
    }
}

module.exports = {
    orderPlacing,
    cashOnDelivery,
    razorPay,
    orderInWallet,
    orderList,
    thankYou,
    orderDetails,
    orders,
    userOrderDetails,
    cancelOrder,
    returnOrder,
    cancelOrderAdmin,
    confirmOrder,
    shippedOrder,
    deliveredOrder,
    pendingOrder,
    failedOrder,
    payFailedAmount,
    orderPlacingFailed,
    downloadInvoice
}