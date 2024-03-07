const Brands = require('../models/brandModel')


const brandList = async (req,res)=>{
    try {
        const brands = await Brands.find()
        if (brands) {
            res.status(200).render('admin/brandList',{brands})
        } else {
            res.status(200).render('admin/brandList',{message:'cant get any brands'})
        }
    } catch (error) {
        console.error(error);
    }
}
const addBrandPage = (req,res)=>{
    try {
        res.status(200).render('admin/addBrand')
    } catch (error) {
        res.status.json({error:'Internal sever error'})
        console.error(error);
    }
}
const addBrand = async (req, res) => {
    isExisting = await Brands.findOne({ name: req.body.brand })
    if (isExisting) {
        res.render('admin/addBrand',{message: 'The Brand is exists'})
    } else {
        const newBrand = new Brands({
            name: req.body.brand,
            description: req.body.description
        })
        await newBrand.save()
        res.redirect('/brandList')
    }

}
const unListBrand = async (req, res,) => {
    try {
        const brandId = req.params.id;
        await Brands.findByIdAndUpdate(brandId, {
            isList: false
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Something went wrong on the server' });
    }
};
const listBrand = async (req, res) => {
    try {
        const brandId = req.params.id;
        await Brands.findByIdAndUpdate(brandId, {
            isList: true
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Something went wrong on the server' });
    }
};
const editBrandPage = async (req, res) => {
    const id = req.params.id
    const brand = await Brands.findById(id)
    res.render('admin/editBrand', { brand })
}


const editBrand = async (req, res) => {
    const id = req.query.id
    const brand  = await Brands.findById(id)
    const isExisting = brand.name 
    if(isExisting == req.body.brand){
       return res.status(200).render('admin/editBrand',{brand ,alert:'The brand is exists'})
    }else{
     
         await Brands.updateOne({ _id: id },
        {
            $set: {
                name: req.body.brand,
                isList: req.body.list,
                description: req.body.description
            }
        }
    )}
    console.log('successfully edited brand')
    res.redirect('/brandList')
}
module.exports = {
    brandList,
    addBrandPage,
    addBrand,
    unListBrand,
    listBrand,
    editBrandPage,
    editBrand
}