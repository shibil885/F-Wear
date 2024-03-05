    const mongoose = require('mongoose')

    const user = new mongoose.Schema({
        username:{
            type:String,
            require:true
        },
        email:{
            type:String,
            require:true
        },
        password:{
            type:String,
            require:true
        },
        isBlocked:{
            type:Boolean,
            default:false,
        },
        phone:{
            type:Number,
            require:true
        }
    })

    module.exports = mongoose.model('User',user)