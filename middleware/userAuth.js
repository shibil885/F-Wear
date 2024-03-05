const User = require('../models/userModel')
const isBlocked = async (req,res,next)=>{
    try {
        const isNotBlocked = await User.findOne({email:req.session.user.email,isBlocked:false}) 
        if (isNotBlocked) {
            next()
        } else {
            res.redirect('/userLogin')
        }
    } catch (error) {
        console.error(error);
    }
} 

const isUser = async (req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('/userLogin')
    }
}

const isLoggedUser =(req,res,next)=>{
    if(req.session.isLogged){
        res.redirect('/')
    }else{
        next() 
    }
}
module.exports={
    isUser,
    isLoggedUser,
    isBlocked
}