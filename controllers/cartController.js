const Cart = require('../models/cartModel')
const Products = require('../models/productModel')
const Address = require('../models/addressModel')
const Coupon = require('../models/couponModel')

const cartPage = async (req, res) => {
    try {
        const userId = req.session.userID
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        const cartLength = userCart ? userCart.items.length : 0;
        return res.render('user/userCartPage', { userCart, cartLength });
    } catch (error) {
        console.error('Error fetching userCart:', error);
        res.status(500).send('Internal Server Error');
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
            return res.status(400).json({ message: "Product not available", icon: "warning", totalStock: product.stock, totalItems: cart.item.length });
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
        
        res.json({
            message: "Product added to cart",
            icon: "success",
            totalItems: cart.items.length, totalStock: product.stock
        });
    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ message: "Internal server error", icon: "error" });
    }
};



const deleteCart = async (req, res) => {
    try {
        const userId = req.session.userID;
        const productId = req.params.productId;

        const userCart = await Cart.findOne({ userID: userId });
        if (!userCart) {
            return res.status(404).json({ success: false, message: 'User cart not found', icon: 'warning' });
        }

        const productInCart = userCart.items.find(item => item.product.toString() === productId);
        if (!productInCart) {
            return res.status(404).json({ success: false, message: 'Product not found in cart', icon: 'warning' });
        }

        // Remove product from cart
        userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
        userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);
        await userCart.save();

        // Restore product stock
        await Products.findByIdAndUpdate(productId, {
            $inc: { stock: productInCart.quantity }
        });

        res.json({ success: true, newTotalPrice: userCart.totalPrice, icon: 'success', messge: 'Product has been removed from cart.', totalItems: userCart.items.length });
    } catch (error) {
        console.error('Error deleting product from cart:', error);
        res.status(500).json({ success: false, message: 'Internal server error', icon: 'error' });
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

                        return res.json({
                            success: true,
                            cartItem,
                            totalPrice: userCart.totalPrice,
                        });
                    } else {
                        return res.json({
                            success: false,
                            message: "Maximum quantity reached for this product",
                        });
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

                    return res.json({
                        success: true,
                        cartItem,
                        totalPrice: userCart.totalPrice,
                    });
                } else {
                    return res.json({
                        success: false,
                        message: "Invalid action or quantity",
                    });
                }
            } else {
                return res.json({
                    success: false,
                    message: "Product not found in the cart",
                });
            }
        } else {
            return res.json({ success: false, message: "User cart not found" });
        }
    } catch (err) {
        next(err);
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
        res.status(200).render('user/checkoutPage', { userAddress, userCart, user: req.session.user, grandTotal, couponToUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    addToCart,
    cartPage,
    deleteCart,
    updateCart,
    checkoutPage
}