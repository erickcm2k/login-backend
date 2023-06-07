const sgMail = require("@sendgrid/mail");
const mailTemplate = require("./template");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, username) => {
  const message = {
    to: email,
    from: "erickce40@gmail.com",
    subject: `Gracias por crear una cuenta en nuestra app, ${username}.`,
    html: mailTemplate(username),
  };
  sgMail.send(message);
};
const sendResetPasswordEmail = (email, username, code) => {
  const mailStr = `${process.env.FRONTEND_URL}?email=${email}`;
  console.log(mailStr);
  const message = {
    to: email,
    from: "erickce40@gmail.com",
    subject: "Código para reestablecer contraseña.",
    html: `
    <div>
    <h3>${username}. El código para reestablecer tu contraseña es: ${code}.</h3>
    <a href="${mailStr}">Visit W3Schools.com!</a>
    <a clicktracking="off" href="${mailStr}">Haz click aquí para reestablecer tu contraseña.</a>
    </div>
    `,
  };
  sgMail.send(message);
};

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
};
