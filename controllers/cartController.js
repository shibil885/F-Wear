const Cart = require('../models/cartModel')
const Products = require('../models/productModel')
const Address = require('../models/addressModel')
const Coupon = require('../models/couponModel')

const cartPage = async (req, res) => {
    try {
        const userId = req.session.userID
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        const cartLength = userCart ? userCart.items.length : 0;
        console.log(userCart);
        return res.render('user/userCartPage', { userCart, cartLength });
    } catch (error) {
        console.error('Error fetching userCart:', error);
        res.status(500).send('Internal Server Error');
    }
}
const addToCart = async (req, res) => {
    try {
        res.json({ message: "success" });

        const userId = req.session.userID;
        const productID = req.params.id;
        const quantity = 1;
        const stock = 1;

        // Find the product by ID
        const product = await Products.findById(productID);
        console.log("product:", product);   
        let userCart = await Cart.findOne({ userID: userId });

        if (!userCart) {
            const newCart = new Cart({
                userID: userId,
                items: [{
                    product: productID,
                    price: product.price,
                    quantity: quantity,
                }],
                totalPrice: product.price * quantity
            });
            const updatedProduct = await Products.findByIdAndUpdate(productID,
                { $inc: { stock: -stock } },
                { new: true })
            console.log('updatedProduct:', updatedProduct);
            await newCart.save();
        } else {
            const existingProduct = userCart.items.find(item => item.product.toString() === productID.toString());

            if (existingProduct) {
                // If the product already exists, update the quantity
                existingProduct.quantity += quantity;
                const updatedProduct = await Products.findByIdAndUpdate(productID,
                    { $inc: { stock: -stock } },
                    { new: true })
                console.log('updatedProduct:', updatedProduct);
            } else {
                // If the product doesn't exist, add a new item to the cart
                userCart.items.push({
                    product: productID,
                    quantity: quantity,
                    price: product.price,
                });
                const updatedProduct = await Products.findByIdAndUpdate(productID,
                    { $inc: { stock: -stock } },
                    { new: true })
                console.log('updatedProduct:', updatedProduct);
            }
            userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

            await userCart.save();
        }

    } catch (error) {
        console.error('Error saving userCart:', error);
    }
};
const deleteCart = async (req, res) => {
    try {
        const userId = req.session.userID;
        const productId = req.params.productId;
        let userCart = await Cart.findOne({ userID: userId });
        const productInCart = userCart.items.find(item => item.product.toString() === productId.toString()); 
        const removedProduct = await Products.findById(productId); 
        
        if (!productInCart) {
            return res.json({ success: false, message: 'Product not found in cart' });
        }

        if (userCart) {
            userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
            userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);

            await userCart.save();
            removedProduct.stock += productInCart.quantity; 
            await removedProduct.save();

            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'User cart not found' });
        }
    } catch (error) {
        console.error('Error deleting product from cart:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

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
                    if ( maxQuantity != 0) {
                        cartItem.quantity += 1;
                        cartItem.price =  cartItem.product.price;

                        userCart.totalPrice = userCart.items.reduce(
                            (total, item) => total + item.price * item.quantity,
                            0
                        );
                      await Products.findByIdAndUpdate(productId,
                          { $inc: { stock: -stock } }, 
                          {new:true})
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
                    cartItem.price =  cartItem.product.price;

                    userCart.totalPrice = userCart.items.reduce(
                        (total, item) => total + item.price * item.quantity,
                        0
                    );
                    const updatedProduct = await Products.findByIdAndUpdate(productId,
                      { $inc: { stock: +stock } }, 
                   {new:true})
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
        const coupons = await Coupon.find({ userID:{$nin:userId}});
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