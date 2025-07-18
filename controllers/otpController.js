const otpGenerator = require('otp-generator');
const OTP = require('../models/otpmodel');
const User = require('../models/userModel');
const {
    sendError,
    MESSAGES
} = require('../util');
const mailSender = require('../util/mailSender');


const signup = async (req, res) => {
    try {
        req.session.userDetails = req.body;
        const email = req.session.userDetails.email
        const checkUserPresent = await User.findOne({
            email: email
        });
        if (checkUserPresent) {
            return res.render('user/userSignup', {
                alert: MESSAGES.auth.EMAIL_EXISTS
            });
        } else {
            let otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            let result = await OTP.findOne({
                otp
            });
            while (result) {
                otp = otpGenerator.generate(6, {
                    upperCaseAlphabets: false,
                });
                result = await OTP.findOne({
                    otp
                });
            }

            const otpPayload = {
                email,
                otp
            };
            await OTP.create(otpPayload);
            await mailSender(
                email,
                '🔐 Email Verification - Action Required',
                `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="background-color: #1d3557; padding: 20px;">
        <h2 style="color: #ffffff; margin: 0;">Welcome to [Your App Name]!</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px;">Hi there,</p>
        <p style="font-size: 16px;">
          You're just one step away from getting started! To verify your email address and complete the signup process, please use the following OTP:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #1d3557; background-color: #e0f0ff; padding: 12px 24px; border-radius: 6px; letter-spacing: 3px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #777;">
          This OTP is valid for the next 10 minutes. Please do not share it with anyone.
        </p>
        <p style="font-size: 14px;">
          If you didn’t request this, you can safely ignore this email.
        </p>
        <div style="margin-top: 30px;">
          <p style="font-size: 14px;">Thank you,<br><strong>The [Your App Name] Team</strong></p>
        </div>
      </div>
    </div>
    <div style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">
      © ${new Date().getFullYear()} [Your App Name]. All rights reserved.
    </div>
  </div>
  `);

            return res.render('user/otpGetPage', {
                email
            })
        }
    } catch (error) {
        console.error(error.message);
        return sendError(res, {
            message: error.message
        });
    }
};

const resendOtp = async (req, res) => {
    try {
        const email = req.session.userDetails.email;
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        await OTP.findOneAndUpdate({
            email
        }, {
            otp
        });

        await mailSender(email, 'Verification Email', `<h3>Confirm your OTP</h3><h5>Here is your new OTP: <b>${otp}</b></h5>`);

        return res.render('user/otpGetPage', {
            email
        });
    } catch (error) {
        console.error(error.message);
        return sendError(res, {
            message: error.message
        });
    }
};


module.exports = {
    signup,
    resendOtp
};