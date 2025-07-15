const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const Products = require('../models/productModel')





const favorite = async (req, res) => {
    try {
        const userId = req.session.userID
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        const userWishList = await Wishlist.findOne({ userID: userId })
            .populate({
                path: 'items.product',
                populate: {
                    path: 'categoryId',
                    model: 'Category'
                }
            });


        const cartLength = userCart ? userCart.items.length : 0;
        return res.render('user/wishList', { userWishList, cartLength, userCart });
    } catch (error) {
        console.error('Error fetching userCart:', error);
        res.status(500).send('Internal Server Error');
    }
}
const addToWishList = async (req, res) => {
    try {
        const userId = req.session.userID;
        const productID = req.params.id;

        // Validate product existence
        const productExists = await Products.exists({ _id: productID });
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found', icon: 'error' });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ userID: userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                userID: userId,
                items: [{ product: productID }]
            });
            await wishlist.save();
            return res.json({ message: 'Product added to wishlist', icon: 'success' });
        }

        // Check if product is already in wishlist
        const isAlreadyAdded = wishlist.items.some(item => item.product.toString() === productID);
        if (isAlreadyAdded) {
            return res.json({ message: 'Product already in wishlist', icon: 'warning' });
        }

        // Add product and save
        wishlist.items.push({ product: productID });
        await wishlist.save();
        return res.json({ message: 'Product added to wishlist', icon: 'success' });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', icon: 'error' });
    }
};


const deleteWishList = async (req, res) => {
    try {
        const userId = req.session.userID
        const wishListId = req.params.id
        const userWishList = await Wishlist.findOne({ userID: userId })
        if (!userWishList) return res.status(404).json({ success: false, message: 'Item not found in list', icon: 'error' })
        userWishList.items = userWishList.items.filter((item) => {
            return item.product.toString() !== wishListId
        })
        await userWishList.save()
        return res.status(200).json({ success: true, message: 'Item removed from list', icon: 'success', totalCount: userWishList.items.length })
    } catch (error) {
        console.error(error);
    }
}
module.exports = {
    favorite,
    addToWishList,
    deleteWishList
}