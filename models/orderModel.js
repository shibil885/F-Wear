const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: false
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productModel' 
        },
        quantity: {
            type: Number,
            required: false
        },
        salesPrice: {
            type: Number,
            required: false
        },
        total: {
            type: Number,
            required: false
        },
        status: {
            type: String,
            default: "pending"
        },
        isDelivered:{
            type:Boolean,
            default:false   
        }
    }],
    firstName:{
        type:String,
        require:true
    },
    lastName:{
        type:String,
        require:true
    },
    paymentStatus: {
        type: String,
        default: 'pending'
    }
});

module.exports = mongoose.model('Order', OrderSchema);
