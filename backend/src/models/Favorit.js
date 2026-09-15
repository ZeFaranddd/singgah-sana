const mongoose = require("mongoose");

const favoritSchema = new mongoose.Schema(
  {
    pencariId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kosId: { type: mongoose.Schema.Types.ObjectId, ref: "Kos", required: true },
  },
  { timestamps: true }
);

// satu pencari tidak boleh menandai kos yang sama dua kali
favoritSchema.index({ pencariId: 1, kosId: 1 }, { unique: true });

module.exports = mongoose.model("Favorit", favoritSchema);
