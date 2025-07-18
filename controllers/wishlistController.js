const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const Products = require('../models/productModel')
const { sendSuccess, sendError, MESSAGES, STATUS_CODES, COMMON_MESSAGES } = require('../util')

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
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const addToWishList = async (req, res) => {
    try {
        const userId = req.session.userID;
        const productID = req.params.id;

        const productExists = await Products.exists({ _id: productID });
        if (!productExists) {
            return sendError(res, { message: MESSAGES.wishlist.PRODUCT_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }

        let wishlist = await Wishlist.findOne({ userID: userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                userID: userId,
                items: [{ product: productID }]
            });
            await wishlist.save();
            return sendSuccess(res, { message: MESSAGES.wishlist.PRODUCT_ADDED });
        }

        const isAlreadyAdded = wishlist.items.some(item => item.product.toString() === productID);
        if (isAlreadyAdded) {
            return sendSuccess(res, { message: MESSAGES.wishlist.PRODUCT_ALREADY_IN_WISHLIST, icon: 'warning' });
        }

        // Add product and save
        wishlist.items.push({ product: productID });
        await wishlist.save();
        return sendSuccess(res, { message: MESSAGES.wishlist.PRODUCT_ADDED });

    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const deleteWishList = async (req, res) => {
    try {
        const userId = req.session.userID
        const wishListId = req.params.id
        const userWishList = await Wishlist.findOne({ userID: userId })
        if (!userWishList) return sendError(res, { message: MESSAGES.wishlist.ITEM_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        userWishList.items = userWishList.items.filter((item) => {
            return item.product.toString() !== wishListId
        })
        await userWishList.save()
        return sendSuccess(res, { message: MESSAGES.wishlist.ITEM_REMOVED, data: { totalCount: userWishList.items.length } });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

module.exports = {
    favorite,
    addToWishList,
    deleteWishList
}