//utils/nodeMailer.js
import 'dotenv/config.js';
import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   host: 'server122.web-hosting.com',
//   port: 465,  
//   auth: {
//     user: 'noreply@mobiledoctor.firststarconsults.online',
//     pass: 'mobiledoctor$1', 
//   },
// });


// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.G_MAIL, 
    pass: process.env.GOOGLE_APPPASSWORD, 
  },
  secure: true,
  tls: {
    rejectUnauthorized: true
  }
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
    from: '"Mobile Doctor" <no-reply@mobiledoctorapp.com>',
    to,
    subject: 'Mobile-Doctor Verification Code',
    text: `Dear Mobile Doctor User,\n\nYour verification code is: ${code}\n\nThank you for choosing Mobile Doctor.\n\nBest regards,\nMobile Doctor Team`,
  };

  return transporter.sendMail(mailOptions);
};




export const sendForgetPasswordEmail = async (to, otp) => {
  const mailOptions = {
    from: '"Mobile Doctor" <no-reply@mobiledoctorapp.com>', 
    to,
    subject: 'Password Reset OTP',
    text: `You have requested a password reset. Use the following OTP to reset your password: ${otp}`,
    html: `<p>You have requested a password reset. Use the following OTP to reset your password:</p>
           <h3>${otp}</h3>`, // Display the OTP in a prominent way
  };

  return transporter.sendMail(mailOptions);
};



export const sendNotificationEmail = async (to, subject, message) => {
  const mailOptions = {
    from: '"Mobile Doctor" <no-reply@mobiledoctorapp.com>',
    to,
    subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  return transporter.sendMail(mailOptions);
};


