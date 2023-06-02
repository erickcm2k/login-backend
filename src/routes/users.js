const express = require("express");
const router = new express.Router();

const { generateHash, isValidPassword } = require("../middleware/auth");
const userSchema = require("../models/user");
const { verifyToken, generateAccessToken } = require("../middleware/jwt");
const { sendWelcomeEmail, sendResetPasswordEmail } = require("../email/mail");
const generateRandomString = require("../utils/generateRandomString");

// Crear usuario y enviar mail de bienvenida
router.post("/new", async (req, res) => {
  try {
    const { name, lastName, email, password } = req.body;
    const usr = await userSchema.findOne({ email });
    if (usr) {
      return res.status(409).send({
        msg: "Ya existe un usuario asociado a esta cuenta de correo electrónico.",
      });
    }
    const newUserObj = {
      name,
      lastName,
      email,
      password,
    };
    newUserObj.password = await generateHash(password);
    const token = generateAccessToken({ email });
    const newUser = new userSchema(newUserObj);
    await newUser.save();
    // sendWelcomeEmail(email, `${name} ${lastName}.`);
    res.status(200).json({ respuesta: "Si jaló", token });
  } catch (error) {
    console.log(error);
    res.status(404).send({
      msg: "El servicio no se encuentra disponible por el momento, inténtalo de nuevo más tarde.",
    });
  }
});

// Inicio de sesión
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userSchema.findOne({ email });

    if (user.status === "DISABLED") {
      return res.status(401).json({
        msg: "El usuario ha sido bloqueado por ingresar en múltiples ocasiones una contraseña incorrecta. Es necesario reestablecer la contraseña.",
      });
    }

    if (isValidPassword(password, user.password)) {
      const token = generateAccessToken(email);
      await userSchema.updateOne({ email }, { tries: 3 });
      res.status(200).json({ respuesta: "Si jaló contraseña", token });
    } else {
      if (user.tries - 1 === 0 || user.tries <= 0) {
        await userSchema.updateOne({ email }, { status: "DISABLED" });
      }
      await userSchema.updateOne({ email }, { tries: user.tries - 1 });
      res.status(401).json({
        respuesta: `Contraseña incorrecta, tiene ${
          user.tries - 1
        } intentos restantes.`,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).send({
      msg: "Error del servicio.",
    });
  }
});

// Verificar token
router.post("/verify", verifyToken, async (req, res) => {
  const { email } = req.body;
  const user = await userSchema.findOne({ email });

  const token = req.token;

  if (user) {
    res.status(200).json({ msg: "Token válido", token });
  } else {
    res.status(404).json({ msg: "No hay un usuario con ese correo." });
  }
});

// Enviar mail para enviar el correo para reestablecer contraseña.
router.post("/forget", async (req, res) => {
  try {
    const authCode = generateRandomString(8);
    const { email } = req.body;
    const user = await userSchema.findOne({ email });
    await userSchema.updateOne({ email }, { authCode });

    if (user) {
      // sendResetPasswordEmail(email, user.name, authCode);
      res.status(200).send({
        msg: `Si es que existe un usuario registrado con la dirección de correo ${email}, se enviarán instrucciones para reestablecer la contraseña.`,
      });
    } else {
      res.status(200).send({
        msg: `Si es que existe un usuario registrado con la dirección de correo ${email}, se enviarán instrucciones para reestablecer la contraseña.`,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).send({
      msg: "Error del servicio.",
    });
  }
});

// Endpoint para reestablecer la contraseña.
router.post("/reset", async (req, res) => {
  try {
    const { email, password, authCode } = req.body;
    let user = await userSchema.findOne({ email });

    if (!user.authCode) {
      return res.status(401).send({ msg: "El código ingresado ha expirado." });
    }

    if (authCode !== user.authCode) {
      return res.status(401).send({ msg: "El código ingresado no es válido." });
    }

    const newPassword = generateHash(password);

    await userSchema.updateOne(
      { email },
      { password: newPassword, authCode: "", status: "ENABLED", tries: 3 }
    );

    user = await userSchema.findOne({ email });

    const token = generateAccessToken(email);

    if (user) {
      res.status(200).send({
        msg: "Contraseña reestablecida exitosamente",
        user: {
          email,
          token,
        },
      });
    } else {
      res.status(404).send({
        msg: "No se encontró un usuario asociado a esta cuenta de correo.",
      });
    }
  } catch (error) {
    res.status(404).send({
      msg: "Error del servicio.",
    });
  }
});

// Obtener perfil
router.get("/profile", verifyToken, async (req, res) => {
  const { email } = req.body;
  const user = await userSchema.findOne({ email });
  const { name, lastName } = user;
  if (user) {
    res.status(200).json({ name, lastName, email });
  } else {
    res.status(404).json({ msg: "No hay un usuario con ese correo." });
  }
});

module.exports = router;
