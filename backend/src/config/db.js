const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB terhubung");
  } catch (err) {
    console.error("Gagal konek MongoDB:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
