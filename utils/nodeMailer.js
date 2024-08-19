//utils/nodeMailer.js
import 'dotenv/config.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'server122.web-hosting.com',
  port: 465,  
  auth: {
    user: 'noreply@mobiledoctor.firststarconsults.online',
    pass: 'mobiledoctor$1', 
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
    from: '"Mobile Doctor" <noreply@mobiledoctor.firststarconsults.online>',
    to,
    subject: 'Mobile-Doctor Verification Code',
    text: `Dear Mobile Doctor User,\n\nYour verification code is: ${code}\n\nThank you for choosing Mobile Doctor.\n\nBest regards,\nMobile Doctor Team`,
  };

  return transporter.sendMail(mailOptions);
};




export const sendForgetPasswordEmail = async (to, token) => {
  const frontend_url = "https://linkProvidedByAlabo.com" 
  const resetLink = `http://${frontend_url}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: '"Mobile Doctor" <noreply@mobiledoctor.firststarconsults.online>', // Updated line
    to,
    subject: 'Password Reset',
    text: `You have requested a password reset. Please click the following link to reset your password: ${resetLink}`,
    html: `<p>You have requested a password reset. Please click the following link to reset your password:</p>
           <a href="${resetLink}">Reset Password</a>`,
  };

  return transporter.sendMail(mailOptions);
};


export const sendNotificationEmail = async (to, subject, message) => {
  const mailOptions = {
    from: '"Mobile Doctor" <noreply@mobiledoctor.firststarconsults.online>',
    to,
    subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  return transporter.sendMail(mailOptions);
};


