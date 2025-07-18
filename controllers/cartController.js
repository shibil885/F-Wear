const Cart = require('../models/cartModel')
const Products = require('../models/productModel')
const Address = require('../models/addressModel')
const Coupon = require('../models/couponModel')
const { sendSuccess, sendError, MESSAGES, STATUS_CODES, COMMON_MESSAGES } = require('../util')

const cartPage = async (req, res) => {
    try {
        const userId = req.session.userID
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        const cartLength = userCart ? userCart.items.length : 0;
        return res.status(STATUS_CODES.OK).render('user/userCartPage', { userCart, cartLength });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const addToCart = async (req, res) => {
    try {
        const userId = req.session.userID;
        const productID = req.params.id;
        const quantityToAdd = 1;

        const product = await Products.findById(productID);
        let cart = await Cart.findOne({ userID: userId });
        if (!product || product.stock < quantityToAdd) {
            return sendError(res, {
                message: MESSAGES.cart.PRODUCT_NOT_AVAILABLE,
                status: STATUS_CODES.BAD_REQUEST,
                icon: "error",
                data: { totalStock: product ? product.stock : 0, totalItems: cart ? cart.items.length : 0 }
            });
        }

        if (!cart) {
            cart = new Cart({
                userID: userId,
                items: [{
                    product: productID,
                    quantity: quantityToAdd,
                    price: product.price
                }],
                totalPrice: product.price * quantityToAdd
            });
        } else {
            const item = cart.items.find(i => i.product.toString() === productID);
            if (item) {
                item.quantity += quantityToAdd;
            } else {
                cart.items.push({
                    product: productID,
                    quantity: quantityToAdd,
                    price: product.price
                });
            }

            cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
        }

        await Products.findByIdAndUpdate(productID, { $inc: { stock: -quantityToAdd } });
        product.stock -= quantityToAdd;
        await cart.save();

        sendSuccess(res, {
            message: MESSAGES.cart.PRODUCT_ADDED,
            icon: "success",
            data: { totalItems: cart.items.length, totalStock: product.stock }
        });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const deleteCart = async (req, res) => {
    try {
        const userId = req.session.userID;
        const productId = req.params.productId;

        const userCart = await Cart.findOne({ userID: userId });
        if (!userCart) {
            return sendError(res, { message: MESSAGES.cart.USER_CART_NOT_FOUND, status: STATUS_CODES.NOT_FOUND, icon: 'warning' });
        }

        const productInCart = userCart.items.find(item => item.product.toString() === productId);
        if (!productInCart) {
            return sendError(res, { message: MESSAGES.cart.PRODUCT_NOT_IN_CART, status: STATUS_CODES.NOT_FOUND, icon: 'warning' });
        }

        userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
        userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);
        await userCart.save();

        await Products.findByIdAndUpdate(productId, {
            $inc: { stock: productInCart.quantity }
        });

        sendSuccess(res, {
            message: MESSAGES.cart.PRODUCT_REMOVED,
            icon: 'success',
            data: { newTotalPrice: userCart.totalPrice, totalItems: userCart.items.length }
        });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const updateCart = async (req, res, next) => {
    try {
        const userId = req.session.userID;
        const productId = req.body.productId;
        const action = req.body.action;
        const stock = 1

        let userCart = await Cart.findOne({ userID: userId }).populate('items.product');

        if (userCart) {
            const cartItem = userCart.items.find(
                (item) => item.product._id.toString() === productId.toString()
            );

            if (cartItem) {
                const product = await Products.findById(productId);
                const maxQuantity = product.stock;

                if (action === "increment") {
                    if (maxQuantity != 0) {
                        cartItem.quantity += 1;
                        cartItem.price = cartItem.product.price;

                        userCart.totalPrice = userCart.items.reduce(
                            (total, item) => total + item.price * item.quantity,
                            0
                        );
                        await Products.findByIdAndUpdate(productId,
                            { $inc: { stock: -stock } },
                            { new: true })
                        await userCart.save();

                        return sendSuccess(res, {
                            data: { cartItem, totalPrice: userCart.totalPrice }
                        });
                    } else {
                        return sendError(res, { message: MESSAGES.cart.MAX_QUANTITY_REACHED, status: STATUS_CODES.OK });
                    }
                } else if (action === "decrement" && cartItem.quantity > 1) {
                    cartItem.quantity -= 1;
                    cartItem.price = cartItem.product.price;

                    userCart.totalPrice = userCart.items.reduce(
                        (total, item) => total + item.price * item.quantity,
                        0
                    );
                    const updatedProduct = await Products.findByIdAndUpdate(productId,
                        { $inc: { stock: +stock } },
                        { new: true })
                    await userCart.save();

                    return sendSuccess(res, {
                        data: { cartItem, totalPrice: userCart.totalPrice }
                    });
                } else {
                    return sendError(res, { message: COMMON_MESSAGES.INVALID_ACTION, status: STATUS_CODES.OK });
                }
            } else {
                return sendError(res, { message: MESSAGES.cart.PRODUCT_NOT_FOUND, status: STATUS_CODES.OK });
            }
        } else {
            return sendError(res, { message: MESSAGES.cart.USER_CART_NOT_FOUND, status: STATUS_CODES.OK });
        }
    } catch (err) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const checkoutPage = async (req, res) => {
    try {
        const userId = req.session.userID;
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product');
        const grandTotal = userCart.totalPrice + 50;
        const userAddress = await Address.findOne({ userID: userId });
        const currentDate = new Date();
        const coupons = await Coupon.find({ userID: { $nin: userId } });
        const couponToUser = coupons.filter(coupon => {
            return (
                coupon.minimumAmount <= grandTotal &&
                coupon.isListed === true &&
                coupon.expiryDate >= currentDate
            );
        });
        res.status(STATUS_CODES.OK).render('user/checkoutPage', { userAddress, userCart, user: req.session.user, grandTotal, couponToUser });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

module.exports = {
    addToCart,
    cartPage,
    deleteCart,
    updateCart,
    checkoutPage
}