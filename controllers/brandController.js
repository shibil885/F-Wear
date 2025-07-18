const Brands = require('../models/brandModel');
const {
    STATUS_CODES,
    sendError,
    sendSuccess,
    MESSAGES,
    COMMON_MESSAGES } = require('../util');

const brandList = async (req, res) => {
    try {
        const brands = await Brands.find();
        if (brands && brands.length) {
            res.status(STATUS_CODES.OK).render('admin/brandList', { brands });
        } else {
            res.status(STATUS_CODES.OK).render('admin/brandList', { message: MESSAGES.brand.CANNOT_GET_BRANDS });
        }
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const addBrandPage = (req, res) => {
    try {
        res.status(STATUS_CODES.OK).render('admin/addBrand');
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const addBrand = async (req, res) => {
    try {
        const { brand, description } = req.body;
        const isExisting = await Brands.findOne({ name: brand });

        if (isExisting) {
            return res.render('admin/addBrand', { message: MESSAGES.brand.BRAND_EXISTS });
        }

        const newBrand = new Brands({ name: brand, description });
        await newBrand.save();

        res.redirect('/brand');
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const updateBrandListStatus = async (req, res) => {
    try {
        const { id: brandId } = req.params;
        const { isList } = req.body;

        if (typeof isList !== 'boolean') {
            return sendError(res, {
                message: MESSAGES.brand.INVALID_LIST_STATUS,
                status: STATUS_CODES.BAD_REQUEST,
            });
        }

        const updatedBrand = await Brands.findByIdAndUpdate(brandId, { isList }, { new: true });

        if (!updatedBrand) {
            return sendError(res, {
                message: MESSAGES.brand.BRAND_NOT_FOUND,
                status: STATUS_CODES.NOT_FOUND,
            });
        }

        sendSuccess(res, {
            message: isList ? MESSAGES.brand.BRAND_LISTED : MESSAGES.brand.BRAND_UNLISTED,
            data: { brand: updatedBrand },
        });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const editBrandPage = async (req, res) => {
    try {
        const brand = await Brands.findById(req.params.id);
        if (!brand)
            return sendError(res, {
                message: MESSAGES.brand.BRAND_NOT_FOUND,
                status: STATUS_CODES.BAD_REQUEST,
                icon: 'warning'
            })

        res.render('admin/editBrand', { brand });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const editBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand: newBrandName, description, list } = req.body;

        const existingBrand = await Brands.findOne({ name: newBrandName });

        if (existingBrand && existingBrand._id.toString() !== id) {
            const brand = await Brands.findById(id);
            return res.status(STATUS_CODES.OK).render('admin/editBrand', {
                brand,
                alert: MESSAGES.brand.BRAND_EXISTS,
            });
        }

        await Brands.updateOne(
            { _id: id },
            {
                $set: {
                    name: newBrandName,
                    description,
                    isList: list,
                },
            }
        );

        res.redirect('/brand');
    } catch (error) {
        sendError(res, { message: MESSAGES.brand.INTERNAL_SERVER_ERROR });
    }
};

module.exports = {
    brandList,
    addBrandPage,
    addBrand,
    updateBrandListStatus,
    editBrandPage,
    editBrand,
};
