const isAdmin = async (req,res,next)=>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/adminLogin')
    }
}
const isLoggedAdmin =(req,res,next)=>{
    if(req.session.isLoggedAdmin){
        res.redirect('/adminPanel')
    }else{
        next()
    }
}

module.exports={
    isAdmin,
    isLoggedAdmin
}