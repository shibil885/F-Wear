const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const {
    STATUS_CODES,
    MESSAGES,
    sendError,
    isDuplicateAddress,
    sendSuccess,
    COMMON_MESSAGES
} = require('../util/index');

const addAddressPage = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(STATUS_CODES.OK).render('user/addAddress', { cartLength })
    } catch (error) {

        sendError(res, STATUS_CODES.INTERNAL_ERROR, COMMON_MESSAGES.INTERNAL_SERVER_ERROR);
    }
}

const addAddress = async (req, res) => {
    try {
        const userId = req.session.userID;
        const userCart = await Cart.findOne({ userID: userId });
        const {
            c_name,
            c_fname,
            c_lname,
            c_address,
            c_state,
            c_pincode,
            c_phone
        } = req.body;

        if (!c_name || !c_fname || !c_lname || !c_address || !c_state || !c_pincode || !c_phone) {
            return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.address.REQUIRED_FIELDS, 'user/addAddress', {
                cartLength: userCart ? userCart.items.length : 0,
                formData: req.body
            });
        }

        let userAddress = await Address.findOne({ userID: userId });

        if (!userAddress) {
            const newAddress = new Address({
                userID: userId,
                details: [{
                    country: c_name,
                    firstName: c_fname,
                    lastName: c_lname,
                    address: c_address,
                    state: c_state,
                    pincode: c_pincode,
                    phone: c_phone
                }]
            });

            await newAddress.save();
            return res.redirect('/address');
        }

        if (!Array.isArray(userAddress.details)) {
            userAddress.details = [];
        }

        const isDuplicate = isDuplicateAddress(userAddress.details, req.body);

        if (isDuplicate) {
            return sendError(res, STATUS_CODES.OK, MESSAGES.address.ADDRESS_EXISTS, 'user/addAddress', {
                cartLength: userCart ? userCart.items.length : 0,
                formData: req.body
            });
        }

        userAddress.details.push({
            country: c_name,
            firstName: c_fname,
            lastName: c_lname,
            address: c_address,
            state: c_state,
            pincode: c_pincode,
            phone: c_phone
        });

        await userAddress.save();
        return res.redirect('/address');

    } catch (error) {
        return sendError(res, STATUS_CODES.INTERNAL_ERROR, MESSAGES.address.ADDRESS_SAVE_ERROR, 'errorPage', {
            message: MESSAGES.address.ADDRESS_SAVE_ERROR
        });
    }
};

const address = async (req, res) => {
    try {
        const userAddress = await Address.findOne({ userID: req.session.userID })
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(STATUS_CODES.OK).render('user/address', { userAddress, cartLength })
    } catch (error) {
        sendError(res, STATUS_CODES.INTERNAL_ERROR, COMMON_MESSAGES.INTERNAL_SERVER_ERROR);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userID;
        const addressId = req.params.id;

        const userAddress = await Address.findOne({ userID: userId });

        if (userAddress) {
            userAddress.details = userAddress.details.filter(address => address._id.toString() !== addressId.toString());
            await userAddress.save();
            return sendSuccess(res, STATUS_CODES.OK, MESSAGES.address.ADDRESS_DELETED, {
                icon: 'success',
                totalAddress: userAddress.details.length
            });
        } else {
            return sendError(res, STATUS_CODES.NOT_FOUND, MESSAGES.address.ADDRESS_NOT_FOUND, null, { icon: 'warning' });
        }

    } catch (error) {
        sendError(res, STATUS_CODES.INTERNAL_ERROR, COMMON_MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

const editAddressPage = async (req, res) => {
    try {
        const addressId = req.params.id
        const userId = req.session.userID
        const userAddress = await Address.findOne({ userID: userId, 'details._id': addressId })
        const addressForEdit = userAddress?.details.find((details) => details._id.toString() === addressId.toString())
        if (userAddress) {
            const userCart = await Cart.findOne({ userID: userId })
            const cartLength = userCart ? userCart.items.length : 0;
            res.status(STATUS_CODES.OK).render('user/editAddress', { addressForEdit, cartLength })
        } else {
            sendError(res, STATUS_CODES.NOT_FOUND, MESSAGES.address.CANT_FIND_ADDRESS);
        }
    } catch (error) {
        sendError(res, STATUS_CODES.INTERNAL_ERROR, COMMON_MESSAGES.INTERNAL_SERVER_ERROR);
    }
}

const editAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.userID;

        const userAddress = await Address.findOne({ userID: userId });

        if (!userAddress) return res.redirect('/address');

        const existingIndex = userAddress.details.findIndex(
            detail => detail._id.toString() === addressId
        );

        if (existingIndex === -1) return res.redirect('/address');

        const isDuplicate = isDuplicateAddress(userAddress.details, req.body, existingIndex);

        if (isDuplicate) {
            const userCart = await Cart.findOne({ userID: userId });
            const cartLength = userCart ? userCart.items.length : 0;
            const addressForEdit = userAddress.details[existingIndex];
            return sendError(res, STATUS_CODES.OK, MESSAGES.address.ADDRESS_EXISTS, 'user/editAddress', {
                addressForEdit,
                cartLength
            });
        }

        userAddress.details[existingIndex] = {
            ...userAddress.details[existingIndex]._doc,
            country: req.body.c_name,
            firstName: req.body.c_fname,
            lastName: req.body.c_lname,
            address: req.body.c_address,
            state: req.body.c_state,
            pincode: req.body.c_pincode,
            phone: req.body.c_phone
        };

        await userAddress.save();
        res.redirect('/address');

    } catch (error) {
        sendError(res, STATUS_CODES.INTERNAL_ERROR, COMMON_MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

const checkOutAddress = async (req, res) => {
    try {
        const userId = req.session.userID;
        const userAddress = await Address.findOne({ userID: userId });
        if (!userAddress) {
            const newAddress = new Address({
                userID: userId,
                details: [{
                    country: req.body.c_name,
                    firstName: req.body.c_fname,
                    lastName: req.body.c_lname,
                    address: req.body.c_address,
                    state: req.body.c_state,
                    pincode: req.body.c_pincode,
                    phone: req.body.c_phone
                }]
            });
            await newAddress.save();
            res.redirect('/checkoutPage');
        } else {
            userAddress.details.push({
                country: req.body.c_name,
                firstName: req.body.c_fname,
                lastName: req.body.c_lname,
                address: req.body.c_address,
                state: req.body.c_state,
                pincode: req.body.c_pincode,
                phone: req.body.c_phone
            });
            await userAddress.save();
            res.redirect('/checkoutPage');
        }
    } catch (error) {
        sendError(res, STATUS_CODES.INTERNAL_ERROR, COMMON_MESSAGES.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    addAddress,
    addAddressPage,
    deleteAddress,
    address,
    editAddressPage,
    editAddress,
    checkOutAddress
}