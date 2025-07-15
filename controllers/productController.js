
const Products = require('../models/productModel')
const Category = require('../models/categoriesModel')
const Brands = require('../models/brandModel')
const Cart = require('../models/cartModel')
const multer = require('multer')




var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

var upload = multer({
  storage: storage,
}).array("images", 5);



const productList = async (req, res) => {
  try {
    const perPage = 5;
    const page = req.query.page || 1;

    const totalProducts = await Products.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const totalProductsCount = totalProducts.length > 0 ? totalProducts[0].count : 0;

    const products = await Products.aggregate([
      {
        $skip: perPage * page - perPage
      },
      {
        $limit: perPage
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: "$category"
      }
    ]);
    const totalPages = Math.ceil(totalProductsCount / perPage);
    res.render("admin/product", {
      product: products,
      totalPages: totalPages,
      currentPage: page,
      perPage: perPage,
    });
  } catch (err) {
    console.log(err);
  }
}

const addProductPage = async (req, res) => {
  try {
    const category = await Category.find()
    const brand = await Brands.find()
    res.status(200).render('admin/addProduct', { category, brand })
  } catch (error) {
    console.error('error occur rendering addProductPage', error)
    res.status(500).json({ error: "Internal server error" })
  }
}

const addProduct = async (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    const { product_title, description, price, category, size, stock, brand } = req.body;

    const images = req.files.map(file => file.filename);

    const product = new Products({
      product_title: product_title,
      description: description,
      price: price,
      categoryId: category,
      brandId: brand,
      size: size,
      stock: stock,
      images: images
    });

    product.save()
      .then(() => {
        res.redirect('/product');
      })
      .catch(error => {
        console.error('Error saving product:', error);
        res.status(500).send('Internal Server Error');
      });
  });
};


const updatePublishStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isPublish } = req.body;

    if (typeof isPublish !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid publish status' });
    }

    const updatedProduct = await Products.findByIdAndUpdate(
      productId,
      { isPublish },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: `Product has been ${isPublish ? 'published' : 'unpublished'} successfully`,
      updatedProduct,
    });
  } catch (error) {
    console.error('Error updating publish status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const editProductPage = async (req, res) => {
  try {
    const id = req.params.id
    const product = await Products.findById(id).populate('categoryId')
    const category = await Category.find()
    const brand = await Brands.find()
    res.render('admin/editProduct', { product, category, brand })
  } catch (error) {
    console.error('error occur while render editProduct page', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

const editProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }
      if (req.files && req.files.length > 0) {
        const images = req.files.map(file => file.filename);
        const result = await Products.findByIdAndUpdate(id, {
          product_title: req.body.product_title,
          description: req.body.description,
          categoryId: req.body.category,
          brandId: req.body.brand,
          price: req.body.price,
          size: req.body.size,
          stock: req.body.stock,
          images: images,
        }).exec();
        if (!result) {
          res.json({ message: "Product not found", type: "danger" });
          return;
        }
        res.redirect("/product");
      } else {
        const result = await Products.findByIdAndUpdate(id, {
          product_title: req.body.product_title,
          description: req.body.description,
          category: req.body.category,
          brandId: req.body.brand,
          price: req.body.price
        }).exec();

        if (!result) {
          res.json({ message: "Product not found", type: "danger" });
          return;
        }
        res.redirect("/product");
      }
    });
  } catch (err) {
    next(err);
  }
}

const productDetails = async (req, res) => {
  try {
    const id = req.params.id
    const product = await Products.findById(id)
    const userData = req.session.user;
    if (userData) {
      const userCart = await Cart.findOne({ userID: req.session.userID });
      const cartLength = userCart ? userCart.items.length : 0;
      return res.render('user/productDetail', { product, cartLength, userData })
    } else {
      const userCart = await Cart.findOne({ userID: req.session.userID });
      const cartLength = userCart ? userCart.items.length : 0;
      console.log('product', product);
      return res.render('user/productDetail', { product, cartLength, userData })
    }
  } catch (error) {
    console.error('error occured while render product details page ', error)
  }
}

const deleteImage = async (req, res) => {
  try {
    const index = req.body.index;
    const img = req.body.img;
    const productId = req.body.productId;
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.images.splice(index, 1);
    await product.save();

    res.status(200).json({ success: true, message: 'Image removed successfully' });
  } catch (error) {
    console.error();
  }
}

module.exports = {
  productList,
  addProductPage,
  addProduct,
  upload,
  updatePublishStatus,
  editProductPage,
  editProduct,
  productDetails,
  deleteImage,
}
