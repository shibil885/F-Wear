const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')






const addAddressPage = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/addAddress',{cartLength})
    } catch (error) {
        console.error(error);
    }
}
const addAddress = async (req, res) => {
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
            res.redirect('/address');
        } else {
            // Check if the address already exists before adding it
            const isAddressExists = userAddress.details.some(address => (
                address.country === req.body.c_name &&
                address.firstName === req.body.c_fname &&
                address.lastName === req.body.c_lname &&
                address.address === req.body.c_address &&
                address.state === req.body.c_state &&
                address.pincode == req.body.c_pincode &&
                address.phone == req.body.c_phone
            ));

            console.log('isAddressExists:', isAddressExists);
            if (!isAddressExists) {
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
                res.redirect('/address');
            } else {
            const userCart = await Cart.findOne({ userID: userId })
            const cartLength = userCart ? userCart.items.length : 0;
                return res.render('user/addAddress', { alert: 'Address already exists',cartLength});
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const address = async (req, res) => {
    try {
        const userAddress = await Address.findOne({ userID: req.session.userID })
        const userCart = await Cart.findOne({ userID: req.session.userID })
        const cartLength = userCart ? userCart.items.length : 0;
        res.status(200).render('user/address', { userAddress,cartLength })
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
            console.log("Address deleted successfully");
            res.status(200).json({ success: true });
        } else {
            console.log("User address not found");
            res.status(404).json({ error: "User address not found" });
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
            res.status(200).render('user/editAddress', { addressForEdit,cartLength })
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
        const addressId = req.params.id
        const userId = req.session.userID
        const userAddress = await Address.findOne({ userID: userId, 'details._id': addressId })

        const isAddressExists = userAddress.details.some(address => (
            address.country === req.body.c_name &&
            address.firstName === req.body.c_fname &&
            address.lastName === req.body.c_lname &&
            address.address === req.body.c_address &&
            address.state === req.body.c_state &&
            address.pincode == req.body.c_pincode &&
            address.phone == req.body.c_phone
        ));
        console.log('isAddressExists:', isAddressExists);
        if (!isAddressExists) {
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
            res.redirect('/address');
        } else {
            const userCart = await Cart.findOne({ userID: userId })
            const cartLength = userCart ? userCart.items.length : 0;
            const addressForEdit = userAddress.details.find((details) => details._id.toString() === addressId.toString())
            return res.render('user/editAddress', { alert: 'Address already exists', addressForEdit,cartLength });
        }
    } catch (error) {
        console.error(error);
    }
}
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