const Wallet = require('../models/walletModel')
const Cart = require('../models/cartModel')
const { sendSuccess, sendError, MESSAGES, STATUS_CODES, COMMON_MESSAGES } = require('../util')

const wallet = async (req, res) => {
    try {
        const userId = req.session.userID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const walletDoc = await Wallet.findOne({ userId }).populate('userId');

        if (!walletDoc) {
            return res.status(404).render('user/wallet', {
                wallet: null,
                user: req.session.user,
                cartLength: 0,
                transactions: [],
                currentPage: page,
                totalPages: 0,
                error: "Wallet not found",
            });
        }

        const sortedHistory = [...walletDoc.history].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        const total = sortedHistory.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedHistory = sortedHistory.slice(skip, skip + limit);

        const userCart = await Cart.findOne({ userID: userId });
        const cartLength = userCart ? userCart.items.length : 0;

        return res.status(STATUS_CODES.OK).render('user/wallet', {
            wallet: walletDoc,
            user: req.session.user,
            cartLength,
            transactions: paginatedHistory,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error loading wallet page:", error);
        return sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

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

module.exports = {
    wallet,
    addAmount
}