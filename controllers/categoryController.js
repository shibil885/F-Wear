const Category = require('../models/categoriesModel')

const Categories = async (req, res) => {
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
        res.render('admin/addCategories',{message: 'The category is exists'})
    } else {
        const newCategory = new Category({
            category: req.body.category,
            description: req.body.description
        })
        await newCategory.save()
        console.log('New category added', req.body);
        res.redirect('/Categories')
    }

}
const editCategoryPage = async (req, res) => {
    const id = req.params.id
    const category = await Category.findById(id)
    res.render('admin/editCategory', { category })
}
const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
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
        res.redirect('/Categories');
    } catch (error) {
        console.error('Error editing category:', error);
        res.status(500).send('Internal Server Error');
    }
}

const unlistCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        console.log(categoryId);
        await Category.findByIdAndUpdate(categoryId, {
            isList: false
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Something went wrong on the server' });
    }
};
const listCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        console.log(categoryId);
        await Category.findByIdAndUpdate(categoryId, {
            isList: true
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Something went wrong on the server' });
    }
};
module.exports = {
    Categories,
    addCategoriesPage,
    addCategory,
    editCategoryPage,
    editCategory,
    unlistCategory,
    listCategory
}