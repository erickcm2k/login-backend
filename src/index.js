"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");

require("./db/mongoose");
require("dotenv").config();

const userRouter = require("./routes/users");

const app = express();
const port = process.env.PORT; // Port for Heroku deployment

app.use(express.json());
app.use("/api", userRouter);

app.listen(port, () => {
  console.log("Server running at port", port);
});
