const express = require("express");
const router = new express.Router();

const { generateHash, isValidPassword } = require("../middleware/auth");
const userSchema = require("../models/user");
const { verifyToken, generateAccessToken } = require("../middleware/jwt");
const { sendWelcomeEmail, sendResetPasswordEmail } = require("../email/mail");
const generateRandomString = require("../utils/generateRandomString");
const user = require("../models/user");

// Crear usuario y enviar mail de bienvenida
router.post("/users/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const usr = await userSchema.findOne({ email });
    if (usr) {
      return res.status(409).send({
        msg: "Ya existe un usuario asociado a esta cuenta de correo electrónico.",
      });
    }
    const newUserObj = {
      username,
      email,
      password,
    };
    newUserObj.password = await generateHash(password);
    const token = generateAccessToken({ email });
    const newUser = new userSchema(newUserObj);
    await newUser.save();
    const user = await userSchema.findOne({ email });

    sendWelcomeEmail(email, `${username}.`);
    res.status(200).json({
      respuesta: "Si jaló",
      token,
      ok: true,
      user: { username: user.username, email: user.email },
    });
  } catch (error) {
    console.log(error);
    res.status(404).send({
      msg: "El servicio no se encuentra disponible por el momento, inténtalo de nuevo más tarde.",
      ok: false,
    });
  }
});

// Inicio de sesión
router.post("/users/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userSchema.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "No tienes cuenta en nuestra app asociada con el email que ingresaste. Te sugerimos crear una nueva cuenta.",
        ok: false,
      });
    }

    if (user.status === "DISABLED") {
      return res.status(401).json({
        msg: "El usuario ha sido bloqueado por ingresar en múltiples ocasiones una contraseña incorrecta. Es necesario reestablecer la contraseña.",
        ok: false,
      });
    }

    if (isValidPassword(password, user.password)) {
      const token = generateAccessToken(email);
      await userSchema.updateOne({ email }, { tries: 3 });
      res
        .status(200)
        .json({ msg: "Si jaló contraseña", token, ok: true, user });
    } else {
      if (user.tries - 1 === 0 || user.tries <= 0) {
        await userSchema.updateOne({ email }, { status: "DISABLED" });
      }
      const currentTries = user.tries - 1;
      await userSchema.updateOne({ email }, { tries: currentTries });
      res.status(401).json({
        msg: `Contraseña incorrecta, tiene ${currentTries} intentos restantes.`,
        ok: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).send({
      msg: "Error del servicio.",
      ok: false,
    });
  }
});

// Verificar token
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new Error("No email");
    }
    const user = await userSchema.findOne({ email });

    if (!user) {
      res
        .status(404)
        .json({ msg: "No hay un usuario con ese correo.", ok: false });
    } else {
      const token = req.token;
      res.status(200).json({
        msg: "Token válido",
        ok: true,
        username: user.username,
        token,
        email,
      });
    }
  } catch (error) {
    {
      console.log(error);
      res.status(404).send({
        msg: "Error del servicio.",
        ok: false,
      });
    }
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
      sendResetPasswordEmail(email, user.username, authCode);
      res.status(200).send({
        msg: `Si es que existe un usuario registrado con la dirección de correo ${email}, se enviarán instrucciones para reestablecer la contraseña.`,
        ok: true,
      });
    } else {
      res.status(401).send({
        msg: `No existe un usuario registrado con la dirección de correo ${email}. Ingresa una dirección de correo válida o crea una cuenta nueva.`,
        ok: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).send({
      msg: "Error del servicio.",
      ok: false,
    });
  }
});

// Endpoint para reestablecer la contraseña.
router.post("/reset", async (req, res) => {
  try {
    const { email, password, authCode } = req.body;
    let user = await userSchema.findOne({ email });

    if (!user.authCode) {
      return res
        .status(401)
        .send({ msg: "El código ingresado ha expirado.", ok: false });
    }

    if (authCode !== user.authCode) {
      return res
        .status(401)
        .send({ msg: "El código ingresado no es válido.", ok: false });
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
        ok: true,
        user: {
          email,
          token,
        },
      });
    } else {
      res.status(404).send({
        msg: "No se encontró un usuario asociado a esta cuenta de correo.",
        ok: false,
      });
    }
  } catch (error) {
    res.status(404).send({
      msg: "Error del servicio.",
      ok: false,
    });
  }
});

// Obtener perfil
router.get("/profile", verifyToken, async (req, res) => {
  const { email } = req.body;
  const user = await userSchema.findOne({ email });
  const { username } = user;
  if (user) {
    res.status(200).json({ username, email, ok: true });
  } else {
    res
      .status(404)
      .json({ msg: "No hay un usuario con ese correo.", ok: false });
  }
});

module.exports = router;
