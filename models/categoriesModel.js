const mongoose =require('mongoose')


const Categories = new mongoose.Schema({
    category:{
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
module.exports=mongoose.model('Category',Categories)