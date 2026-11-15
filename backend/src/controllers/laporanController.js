const Laporan = require('../models/Laporan');
const Kos = require('../models/Kos');
const { kirimNotifikasiKeAdmin } = require('../utils/notifikasi');
const { catatAktivitas } = require('../utils/aktivitas');

const sendLaporan = async (req, res, next) => {
  try {
    const { kos_id, alasan, deskripsi } = req.body;

    if (!kos_id || !alasan || !deskripsi) {
      return res.status(400).json({
        success: false,
        message: 'Mohon sertakan kos_id, alasan, dan deskripsi laporan',
      });
    }

    const kos = await Kos.findById(kos_id);
    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    if (kos.status_verifikasi !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Hanya kos yang sudah tayang publik yang dapat dilaporkan',
      });
    }

    // Satu pencari hanya boleh punya satu laporan aktif per kos
    const aktif = await Laporan.findOne({
      pelapor_id: req.user._id,
      kos_id,
      status: { $in: ['terbuka', 'diproses'] },
    });
    if (aktif) {
      return res.status(409).json({
        success: false,
        message: 'Anda sudah memiliki laporan yang sedang ditangani untuk kos ini',
        data: { laporan_id: aktif._id },
      });
    }

    const laporan = await Laporan.create({
      pelapor_id: req.user._id,
      kos_id,
      kos_nama: kos.nama,
      alasan,
      deskripsi,
    });

    await Promise.all([
      kirimNotifikasiKeAdmin({
        tipe: 'laporan_baru',
        judul: `Laporan baru: ${kos.nama}`,
        isi: deskripsi.slice(0, 200),
        tautan: '/admin/laporan',
      }),
      catatAktivitas({
        aktor: req.user,
        aksi: 'laporan_dibuat',
        targetTipe: 'laporan',
        targetId: laporan._id,
        targetLabel: kos.nama,
        ringkasan: `${req.user.nama} melaporkan kos "${kos.nama}"`,
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Laporan berhasil dikirim dan akan diperiksa oleh Administrator',
      data: laporan,
    });
  } catch (error) {
    next(error);
  }
};

const getMyLaporan = async (req, res, next) => {
  try {
    const data = await Laporan.find({ pelapor_id: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendLaporan, getMyLaporan };
