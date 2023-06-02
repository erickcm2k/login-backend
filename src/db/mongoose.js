const mongoose = require("mongoose");
require("dotenv").config();

// mongoose.connect(process.env.MONGODB_URL, {
//   useFindAndModify: false,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
//   useNewUrlParser: true,
// });

mongoose.connect(process.env.MONGODB_URL);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection errror"));
db.once("open", () => {
  console.log("Connected");
});
