const isDuplicateAddress = (details, body, excludeIndex = -1) => {
  return details.some((address, idx) =>
    idx !== excludeIndex &&
    address.country === body.c_name &&
    address.firstName === body.c_fname &&
    address.lastName === body.c_lname &&
    address.address === body.c_address &&
    address.state === body.c_state &&
    address.pincode == body.c_pincode &&
    address.phone == body.c_phone
  );
};

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
      from: process.env.MAIL_USER,
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log('Email sent successfully', info);
    return info;
  } catch (error) {
    console.error('Error occurred while sending email', error);
    throw error;
  }
};

module.exports = { isDuplicateAddress, mailSender };
