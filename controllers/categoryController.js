const Category = require('../models/categoriesModel')
const { sendSuccess, sendError, MESSAGES, STATUS_CODES, COMMON_MESSAGES } = require('../util')

const categories = async (req, res) => {
    try {
        const categories = await Category.find()
        res.render('admin/Categories', { categories })
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const addCategoriesPage = (req, res) => {
    try {
        res.render('admin/addCategories')
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const addCategory = async (req, res) => {
    try {
        const isExisting = await Category.findOne({ category: req.body.category })
        if (isExisting) {
            return res.render('admin/addCategories', { message: MESSAGES.category.CATEGORY_EXISTS })
        } else {
            const newCategory = new Category({
                category: req.body.category,
                description: req.body.description
            })
            await newCategory.save()
            res.redirect('/category')
        }
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const editCategoryPage = async (req, res) => {
    try {
        const id = req.params.id
        const category = await Category.findById(id)
        res.render('admin/editCategory', { category })
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const category = await Category.findById(id)
        const newCategoryName = req.body.category;
        const existingCategory = await Category.findOne({ category: newCategoryName });
        if (existingCategory && existingCategory._id.toString() !== id) {
            return res.status(STATUS_CODES.OK).render('admin/editCategory', { category, alert: MESSAGES.category.CATEGORY_EXISTS });
        }
        await Category.updateOne(
            { _id: id },
            {
                $set: {
                    category: newCategoryName,
                    isList: req.body.list,
                    description: req.body.description
                }
            }
        );
        res.redirect('/category');
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const updateCategoryListStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { isList } = req.body;

        if (typeof isList !== 'boolean') {
            return sendError(res, { message: MESSAGES.category.INVALID_LIST_STATUS, status: STATUS_CODES.BAD_REQUEST });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { isList },
            { new: true }
        );

        if (!updatedCategory) {
            return sendError(res, { message: MESSAGES.category.CATEGORY_NOT_FOUND, status: STATUS_CODES.NOT_FOUND });
        }

        sendSuccess(res, {
            message: `Category has been ${isList ? 'listed' : 'unlisted'} successfully`,
            data: { category: updatedCategory }
        });
    } catch (error) {
        sendError(res, { message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

module.exports = {
    categories,
    addCategoriesPage,
    addCategory,
    editCategoryPage,
    editCategory,
    updateCategoryListStatus
}