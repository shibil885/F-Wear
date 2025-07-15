const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')


const isDuplicateAddress = (details, body, excludeIndex = -1) => {
    return details.some((address, idx) =>
        idx !== excludeIndex &&
        address.country === body.c_name &&
        address.firstName === body.c_fname &&
        address.lastName === body.c_lname &&
        address.address === body.c_address &&
        address.state === body.c_state &&
        address.pincode == body.c_pincode &&
        address.phone == body.c_phone
    );
};



const addAddressPage = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/addAddress', { cartLength })
    } catch (error) {
        console.error(error);
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
            return res.status(400).render('user/addAddress', {
                alert: 'All fields are required',
                cartLength: userCart.items.length,
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
            const cartLength = userCart ? userCart.items.length : 0;

            return res.render('user/addAddress', {
                alert: 'Address already exists',
                cartLength,
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
        console.error('Error while adding address:', error);
        return res.status(500).render('errorPage', {
            message: 'Something went wrong while saving address. Please try again.'
        });
    }
};

const address = async (req, res) => {
    try {
        const userAddress = await Address.findOne({ userID: req.session.userID })
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/address', { userAddress, cartLength })
    } catch (error) {
        console.error(error);
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
            return res.status(200).json({ success: true, icon: 'success', message: 'Your address has been deleted.', totalAddress: userAddress.details.length });
        } else {
            return res.status(404).json({ success: false, icon: 'warning', error: "Selected address not found" });
        }

    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
const editAddressPage = async (req, res) => {
    try {
        const addressId = req.params.id
        const userId = req.session.userID
        const userAddress = await Address.findOne({ userID: userId, 'details._id': addressId })
        const addressForEdit = userAddress.details.find((details) => details._id.toString() === addressId.toString())
        if (userAddress) {
            const userCart = await Cart.findOne({ userID: userId })
            const cartLength = userCart ? userCart.items.length : 0;
            res.status(200).render('user/editAddress', { addressForEdit, cartLength })
        } else {
            res.json({ error: "Can't find address" })
        }
    } catch (error) {
        res.json({ error: 'Internal server error' })
        console.error(error);
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
            return res.render('user/editAddress', {
                alert: 'Address already exists',
                addressForEdit,
                cartLength
            });
        }

        // Update the existing address
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
        console.error('Error editing address:', error);
        res.status(500).send('Internal Server Error');
    }
};


const checkOutAddress = async (req, res) => {
    try {
        console.log('hit checkout address');
        const userId = req.session.userID;
        const userAddress = await Address.findOne({ userID: userId });
        console.log('user adrees', userAddress);
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
        }
    } catch (error) {
        console.error(error);
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