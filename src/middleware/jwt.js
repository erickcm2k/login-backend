const jwt = require("jsonwebtoken");

const generateAccessToken = (username) => {
  return jwt.sign(
    { username: username },
    process.env.TOKEN_SECRET,
    (options = { algorithm: "HS256", expiresIn: "1 day" })
  );
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    jwt.verify(
      token,
      process.env.TOKEN_SECRET,
      (options = { algorithm: "HS256" }),
      (err) => {
        if (err) {
          return res.sendStatus(401).json();
        }
        req.token = token;
        next();
      }
    );
  } catch (error) {
    res.status(401).json({ msg: "Error con la autenticación." });
  }
};

module.exports = { generateAccessToken, verifyToken };
