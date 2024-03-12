//utils/nodeMailer.js

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,  
    auth: {
      user: 'verify@mobiledoctor.homes',
      pass: process.env.VERIFICATION_EMAIL_PASSWORD,
    },
  });

export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: 'verify@mobiledoctor.homes',
    to,
    subject: 'Verification Code',
    text: `Your verification code is: ${code}`,
  };

  return transporter.sendMail(mailOptions);
};
