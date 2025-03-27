const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,

    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOption = {
    from: "John Ayodele <hr@johhelp.org>",
    to: options.to,
    subject: options.subject,
    text: options.text,
  };
  await transporter.sendMail(mailOption, (error, info) => {
    if (error) {
      console.error("Error:", error.message);
      console.log(options);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};
module.exports = sendEmail;
