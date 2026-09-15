const mongoose = require("mongoose");

const kosSchema = new mongoose.Schema(
  {
    pemilikId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nama: { type: String, required: true },
    alamat: { type: String, required: true },
    koordinat: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    foto: [{ type: String }], // array URL foto
    hargaPerBulan: { type: Number, required: true },
    tipe: {
      type: String,
      enum: ["putra", "putri", "campur"],
      required: true,
    },
    fasilitas: [{ type: String }], // contoh: ["AC", "WiFi", "Kamar Mandi Dalam", "Parkir"]
    jumlahKamarTersedia: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kos", kosSchema);
