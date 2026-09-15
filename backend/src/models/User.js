const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // disimpan dalam bentuk hash
    role: {
      type: String,
      enum: ["pemilik", "admin", "pencari"],
      default: "pencari",
      required: true,
    },
    noHp: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
