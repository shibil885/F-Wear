const mongoose = require('mongoose')
const wishListSchema  = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productModel',
            require: true
        }
    }]
    
})
module.exports = mongoose.model('WishList',wishListSchema)