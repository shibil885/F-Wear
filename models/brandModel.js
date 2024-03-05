const mongoose =require('mongoose')


const Brand = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    isList:{
        type:Boolean,
        default:true,
        require:true
    },
    description:{
        type:String,
        require:true
    }
})
module.exports=mongoose.model('Brand',Brand)