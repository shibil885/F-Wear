const mongoose = require('mongoose')

const Address = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    details:[{
        country:{
            type:String,
            require:true
        },
        firstName:{
            type:String,
            require:true
        },
        lastName:{
            type:String,
            require:true
        },
        address:{
            type:String,
            require:true
        },
        state:{
            type:String,
            require:true
        },
        pincode:{
            type:Number,
            require:true
        }, 
        phone:{
            type:Number,
            require:true
        },
        isSelected:{
            type:Boolean,
            default:false,
            require:true
        }   
    }]
    
})
module.exports = mongoose.model('Address',Address)