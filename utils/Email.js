const nodemailer = require('nodemailer');

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailoptions = {
    to: options.email,
    from: 'Support:application@test.com',
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailoptions);
};

module.exports = sendMail;
