//utils/nodeMailer.js
import 'dotenv/config.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'server122.web-hosting.com',
  port: 465,  
  auth: {
    user: 'verificationcode@mobiledoctor.firststarconsults.online',
    pass: 'mobiledoctor$1', // Password set directly here
  },
});




  // Verify SMTP configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP configuration error:');
    console.error(error);
  } else {
    console.log("SMTP configuration is correct. Server is ready to take our messages.");
  }
});

export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: 'verify@mobiledoctor.firststarconsults.online',
    to,
    subject: 'Mobile-Doctor Verification Code',
    text: `Dear Mobile Doctor User,\n\nYour verification code is: ${code}\n\nThank you for choosing Mobile Doctor.\n\nBest regards,\nMobile Doctor Team`,
  };

  return transporter.sendMail(mailOptions);
};


export const sendForgetPasswordEmail = async (to, code) => {
  const mailOptions = {
    from: 'noreply@mobiledoctor.firststarconsults.online',
    to,
    subject: 'Mobile-Doctor- Password Reset',
    text: `find your temperal reset pasword token`,
  };

  return transporter.sendMail(mailOptions);
};

