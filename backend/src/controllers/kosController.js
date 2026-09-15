const Kos = require("../models/Kos");

/* ==================== BAGIAN ORANG B — PEMILIK ==================== */

// POST /api/kos  (auth: pemilik)
async function tambahKos(req, res) {
  try {
    const {
      nama,
      alamat,
      koordinat,
      foto,
      hargaPerBulan,
      tipe,
      fasilitas,
      jumlahKamarTersedia,
    } = req.body;

    if (!nama || !alamat || !koordinat || !hargaPerBulan || !tipe) {
      return res.status(400).json({ message: "Data kos belum lengkap" });
    }

    const kos = await Kos.create({
      pemilikId: req.user.id,
      nama,
      alamat,
      koordinat,
      foto,
      hargaPerBulan,
      tipe,
      fasilitas,
      jumlahKamarTersedia,
      status: "pending",
    });

    res.status(201).json({ message: "Kos berhasil didaftarkan, menunggu verifikasi admin", kos });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// GET /api/kos/saya  (auth: pemilik)
async function lihatKosSaya(req, res) {
  try {
    const daftarKos = await Kos.find({ pemilikId: req.user.id }).sort({ createdAt: -1 });
    res.json(daftarKos);
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// PUT /api/kos/:id  (auth: pemilik, hanya miliknya sendiri)
async function editKos(req, res) {
  try {
    const kos = await Kos.findById(req.params.id);
    if (!kos) return res.status(404).json({ message: "Kos tidak ditemukan" });

    if (kos.pemilikId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bukan pemilik kos ini" });
    }

    // Jika data diedit, kembalikan status ke pending untuk diverifikasi ulang
    Object.assign(kos, req.body, { status: "pending" });
    await kos.save();

    res.json({ message: "Kos berhasil diperbarui, menunggu verifikasi ulang", kos });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// DELETE /api/kos/:id  (auth: pemilik)
async function hapusKos(req, res) {
  try {
    const kos = await Kos.findById(req.params.id);
    if (!kos) return res.status(404).json({ message: "Kos tidak ditemukan" });

    if (kos.pemilikId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bukan pemilik kos ini" });
    }

    await kos.deleteOne();
    res.json({ message: "Kos berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

/* ==================== BAGIAN ORANG C — ADMIN & PUBLIK ==================== */

// GET /api/kos/pending  (auth: admin)
async function lihatKosPending(req, res) {
  try {
    const daftarKos = await Kos.find({ status: "pending" })
      .populate("pemilikId", "nama email noHp")
      .sort({ createdAt: 1 });
    res.json(daftarKos);
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// PATCH /api/kos/:id/verifikasi  (auth: admin)  body: { status: "approved" | "rejected" }
async function verifikasiKos(req, res) {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status verifikasi tidak valid" });
    }

    const kos = await Kos.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!kos) return res.status(404).json({ message: "Kos tidak ditemukan" });

    res.json({ message: `Kos berhasil di-${status}`, kos });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// GET /api/kos  (publik)  query: lokasi, hargaMin, hargaMax, tipe, fasilitas
async function listKosPublik(req, res) {
  try {
    const { lokasi, hargaMin, hargaMax, tipe, fasilitas } = req.query;

    const filter = { status: "approved" };

    if (lokasi) filter.alamat = { $regex: lokasi, $options: "i" };
    if (tipe) filter.tipe = tipe;
    if (fasilitas) filter.fasilitas = { $in: fasilitas.split(",") };
    if (hargaMin || hargaMax) {
      filter.hargaPerBulan = {};
      if (hargaMin) filter.hargaPerBulan.$gte = Number(hargaMin);
      if (hargaMax) filter.hargaPerBulan.$lte = Number(hargaMax);
    }

    const daftarKos = await Kos.find(filter).sort({ createdAt: -1 });
    res.json(daftarKos);
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// GET /api/kos/:id  (publik)
async function detailKos(req, res) {
  try {
    const kos = await Kos.findById(req.params.id).populate("pemilikId", "nama noHp email");
    if (!kos || kos.status !== "approved") {
      return res.status(404).json({ message: "Kos tidak ditemukan" });
    }
    res.json(kos);
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

module.exports = {
  tambahKos,
  lihatKosSaya,
  editKos,
  hapusKos,
  lihatKosPending,
  verifikasiKos,
  listKosPublik,
  detailKos,
};
