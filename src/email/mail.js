const sgMail = require("@sendgrid/mail");
const mailTemplate = require("./template");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  const message = {
    to: email,
    from: "erickce40@gmail.com",
    subject: `Gracias por crear una cuenta en nuestra app, ${name}.`,
    html: mailTemplate(name),
  };
  sgMail.send(message);
};
const sendResetPasswordEmail = (email, name, code) => {
  const message = {
    to: email,
    from: "erickce40@gmail.com",
    subject: "Código para reestablecer contraseña.",
    text: `Hola, ${name}. El código para reestablecer tu contraseña es: ${code}.`,
  };
  sgMail.send(message);
};

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
};
