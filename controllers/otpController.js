const otpGenerator = require('otp-generator');
const OTP = require('../models/otpmodel');
const User = require('../models/userModel');
//const mailSender = require('../util/mailSender');
const twilio = require('twilio')

const signup = async (req, res) => {
    try {
         req.session.userDetails = req.body;
         const email = req.session.userDetails.email
        const checkUserPresent = await User.findOne({ email: email});
        if (checkUserPresent) {
            return res.render('user/userSignup',{alert:'email already exist'});
        }
        else{

        //   Generate OTP
          let otp = otpGenerator.generate(6, {
              upperCaseAlphabets: false,
              lowerCaseAlphabets: false,
              specialChars: false,
          });
          let result = await OTP.findOne({ otp });
          while (result) {
              otp = otpGenerator.generate(6, {
                  upperCaseAlphabets: false,
              });
              result = await OTP.findOne({ otp });
          }

          const otpPayload = { email, otp };
          const otpBody = await OTP.create(otpPayload);
        //   Send OTP via email
          await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your OTP: <b>${otp}</b></h5>`);
          // Rendering otp page
        
          return res.render('user/otpGetPage',{email })
        }      
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};
const resendOtp = async (req, res) => {
    try {
        const email = req.session.userDetails.email
        // Generate new OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Save new OTP to the database
        await OTP.findOneAndUpdate({ email }, { otp });

        // Send OTP via email
        await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your new OTP: <b>${otp}</b></h5>`);

        // Rendering OTP page with email
        return res.render('user/otpGetPage', { email });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};


module.exports = {
    signup,
    resendOtp
};
