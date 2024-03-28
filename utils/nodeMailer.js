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
    from: 'verificationcode@mobiledoctor.firststarconsults.online',
    to,
    subject: 'Verification Code',
    text: `Your verification code is: ${code}`,
  };

  return transporter.sendMail(mailOptions);
};
