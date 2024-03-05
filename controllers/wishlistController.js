const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const Products = require('../models/productModel')





const favorite = async (req, res) => {
    try {
        const userId = req.session.userID
        const userCart = await Cart.findOne({ userID: userId }).populate('items.product')
        const userWishList = await Wishlist.findOne({ userID: userId }).populate('items.product')
        console.log(userWishList);
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
        const product = await Products.findById(productID)
        let userWishList = await Wishlist.findOne({ userID: userId });

        if (!userWishList) {
            const newWishlist = new Wishlist({
                userID: userId,
                items: [{
                    product: productID
                }],
            });
            await newWishlist.save();
        } else {
            const existingProduct = userWishList.items.find(item => item.product == productID);
            if (existingProduct) {
                return res.json({ message: 'Product already in wishlist',icon:"warning" });
            } else {
                userWishList.items.push({
                    product: productID,
                });
                res.json({ message: 'Product added to wishlist',icon:"success"});
            }
            await userWishList.save();
        }
    } catch (error) {
        console.error('Error saving userCart:', error);
    }
};

const deleteWishList = async(req,res)=>{
    try {
       const userId = req.session.userID
       const wishListId = req.params.id
       console.log(wishListId);
       const userWishList = await Wishlist.findOne({userID:userId})
       userWishList.items  = userWishList.items.filter((item)=>{
         return item.product.toString() !== wishListId
       })
       await userWishList.save()
       res.json({success:true})
    } catch (error) {
        console.error(error);
    }
}
module.exports = {
    favorite,
    addToWishList,
    deleteWishList
}