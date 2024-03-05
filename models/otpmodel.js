const mongoose = require('mongoose')
const mailSender = require('../util/mailSender')
const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        require:true
    },
    otp:{
        type:String,
        require:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60
    }
    
})
//Define a function to send email
async function sendVerificationEmail(email,otp){
    try{
        const mailResponse =mailSender(
            email,
            'Verification Email',
            `<h1>Confirm your OTP</h1>
            <h1>Here is your OTP:${otp}</h1>`
        )
        console.log('mail sent successfully',mailResponse);
    }catch (error){
        console.log('Error occurred while sending email',error);
    }
}
otpSchema.pre('save', async function (next) {
    console.log('New Document saved to DataBase');
    if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
});

module.exports = mongoose.model('OTP',otpSchema)