const Wallet = require('../models/walletModel')
const Cart = require('../models/cartModel')

const wallet = async (req,res)=>{
    try {
        const userId = req.session.userID
        const wallet = await Wallet.findOne({userId:userId}).populate('userId')
        const userCart = await Cart.findOne({ userID: userId })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/wallet',{wallet,user: req.session.user,cartLength})
    } catch (error) {
        console.error(error);
        res.json({error:'Internal server error'})
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
            description:'Amount added through online'
        });

        await userWallet.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal server error' });
    }
}

module.exports={
    wallet,
    addAmount
}