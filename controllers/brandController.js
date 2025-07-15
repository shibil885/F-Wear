const Brands = require('../models/brandModel')


const brandList = async (req, res) => {
    try {
        const brands = await Brands.find()
        if (brands) {
            res.status(200).render('admin/brandList', { brands })
        } else {
            res.status(200).render('admin/brandList', { message: 'cant get any brands' })
        }
    } catch (error) {
        console.error(error);
    }
}
const addBrandPage = (req, res) => {
    try {
        res.status(200).render('admin/addBrand')
    } catch (error) {
        res.status.json({ error: 'Internal sever error' })
        console.error(error);
    }
}
const addBrand = async (req, res) => {
    isExisting = await Brands.findOne({ name: req.body.brand })
    if (isExisting) {
        res.render('admin/addBrand', { message: 'The Brand is exists' })
    } else {
        const newBrand = new Brands({
            name: req.body.brand,
            description: req.body.description
        })
        await newBrand.save()
        res.redirect('/brand')
    }

}

const updateBrandListStatus = async (req, res) => {
    try {
        const brandId = req.params.id;
        const { isList } = req.body;

        if (typeof isList !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Invalid list status' });
        }

        const updatedBrand = await Brands.findByIdAndUpdate(
            brandId,
            { isList },
            { new: true }
        );

        if (!updatedBrand) {
            return res.status(404).json({ success: false, message: 'Brand not found' });
        }

        res.status(200).json({
            success: true,
            message: `Brand has been ${isList ? 'listed' : 'unlisted'} successfully`,
            brand: updatedBrand
        });
    } catch (error) {
        console.error('Error updating brand list status:', error);
        res.status(500).json({ success: false, message: 'Something went wrong on the server' });
    }
};


const editBrandPage = async (req, res) => {
    const id = req.params.id
    const brand = await Brands.findById(id)
    res.render('admin/editBrand', { brand })
}


const editBrand = async (req, res) => {
    const id = req.params.id
    const brand = await Brands.findById(id)
    const isExisting = brand.name
    if (isExisting == req.body.brand) {
        return res.status(200).render('admin/editBrand', { brand, alert: 'The brand is exists' })
    } else {
        await Brands.updateOne({ _id: id },
            {
                $set: {
                    name: req.body.brand,
                    isList: req.body.list,
                    description: req.body.description
                }
            }
        )
    }
    console.log('successfully edited brand')
    res.redirect('/brand')
}
module.exports = {
    brandList,
    addBrandPage,
    addBrand,
    updateBrandListStatus,
    editBrandPage,
    editBrand
}