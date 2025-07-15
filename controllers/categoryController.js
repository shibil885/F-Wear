const Category = require('../models/categoriesModel')

const categories = async (req, res) => {
    const categories = await Category.find()
    res.render('admin/Categories', { categories })
    console.log('successfully get categories from db');
}
const addCategoriesPage = (req, res) => {
    res.render('admin/addCategories')
}
const addCategory = async (req, res) => {
    isExisting = await Category.findOne({ category: req.body.category })
    if (isExisting) {
        res.render('admin/addCategories', { message: 'The category is exists' })
    } else {
        const newCategory = new Category({
            category: req.body.category,
            description: req.body.description
        })
        await newCategory.save()
        console.log('New category added', req.body);
        res.redirect('/category')
    }

}
const editCategoryPage = async (req, res) => {
    const id = req.params.id
    const category = await Category.findById(id)
    res.render('admin/editCategory', { category })
}
const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const category = await Category.findById(id)
        const newCategoryName = req.body.category;
        const existingCategory = await Category.findOne({ category: newCategoryName });
        if (existingCategory && existingCategory._id.toString() !== id) {
            return res.status(200).render('admin/editCategory', { category, alert: 'The category already exists' });
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
        console.log('Successfully edited category');
        res.redirect('/category');
    } catch (error) {
        console.error('Error editing category:', error);
        res.status(500).send('Internal Server Error');
    }
}

const updateCategoryListStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { isList } = req.body;

        if (typeof isList !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Invalid list status' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { isList },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.status(200).json({
            success: true,
            message: `Category has been ${isList ? 'listed' : 'unlisted'} successfully`,
            category: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category list status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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