const Favorit = require("../models/Favorit");

// POST /api/favorit  (auth: pencari)  body: { kosId }
async function tandaiFavorit(req, res) {
  try {
    const { kosId } = req.body;
    if (!kosId) return res.status(400).json({ message: "kosId wajib diisi" });

    const favorit = await Favorit.create({ pencariId: req.user.id, kosId });
    res.status(201).json({ message: "Kos ditandai sebagai favorit", favorit });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Kos sudah ada di daftar favorit" });
    }
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// DELETE /api/favorit/:id  (auth: pencari)
async function batalFavorit(req, res) {
  try {
    const favorit = await Favorit.findById(req.params.id);
    if (!favorit) return res.status(404).json({ message: "Data favorit tidak ditemukan" });

    if (favorit.pencariId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bukan pemilik data favorit ini" });
    }

    await favorit.deleteOne();
    res.json({ message: "Favorit berhasil dibatalkan" });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// GET /api/favorit/saya  (auth: pencari)
async function lihatFavoritSaya(req, res) {
  try {
    const daftar = await Favorit.find({ pencariId: req.user.id }).populate("kosId");
    res.json(daftar);
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

module.exports = { tandaiFavorit, batalFavorit, lihatFavoritSaya };
