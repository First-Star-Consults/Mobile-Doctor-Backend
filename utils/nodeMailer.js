//utils/nodeMailer.js
import 'dotenv/config.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'server122.web-hosting.com',
    port: 465,  
    auth: {
      user: 'verificationcode@mobiledoctor.firststarconsults.online',
      pass: process.env.VERIFICATION_EMAIL_PASSWORD,
    },
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
