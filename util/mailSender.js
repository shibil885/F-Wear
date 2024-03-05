const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        let info = await transporter.sendMail({
            from:process.env.MAIL_USER ,
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });

        console.log('Email sent successfully', info);
        return info;
    } catch (error) {
        console.error('Error occurred while sending email', error);
        throw error; // Re-throw the error to handle it at the calling site
    }
};

module.exports = mailSender;
