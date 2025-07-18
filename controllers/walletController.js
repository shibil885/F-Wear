const Wallet = require('../models/walletModel')
const Cart = require('../models/cartModel')
const { sendSuccess, sendError, MESSAGES, STATUS_CODES, COMMON_MESSAGES } = require('../util')

const wallet = async (req,res)=>{
    try {
        const userId = req.session.userID;
        const wallet = await Wallet.findOne({userId:userId}).populate('userId');
        const userCart = await Cart.findOne({ userID: userId })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(STATUS_CODES.OK).render('user/wallet',{wallet,user:req.session.user,cartLength})
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const addAmount = async (req, res) => {
    try {
        const userId = req.session.userID;
        const amount = req.body.amount;
        const userWallet = await Wallet.findOne({ userId: userId });
        userWallet.balance += parseInt(amount);
        userWallet.history.push({
            amount: parseInt(amount),
            type: 'credit',
            description: 'Amount added through online'
        });

        await userWallet.save();
        sendSuccess(res, { message: 'Amount added successfully' });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

module.exports={
    wallet,
    addAmount
}