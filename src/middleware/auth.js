const bcrypt = require("bcryptjs");

const generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
const isValidPassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};



module.exports = {
  generateHash,
  isValidPassword,
};
