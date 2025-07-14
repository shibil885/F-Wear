const User = require('../models/userModel')
const isBlocked = async (req, res, next) => {
    try {
        const isNotBlocked = await User.findOne({ email: req.session.user.email, isBlocked: false })
        if (isNotBlocked) {
            next()
        } else {
            res.redirect('/userLogin')
        }
    } catch (error) {
        console.error(error);
    }
}

const isUser = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        const isApiCall = req.headers.accept?.includes('application/json');
        if (isApiCall) {
            return res.status(401).json({ message: 'Unauthorized', status: 401 });
        }

        res.redirect('/userLogin');
    }
};


const isLoggedUser = (req, res, next) => {
    if (req.session.isLogged) {
        res.redirect('/')
    } else {
        next()
    }
}
module.exports = {
    isUser,
    isLoggedUser,
    isBlocked
}