const Kos = require('../models/Kos');
const User = require('../models/User');
const Laporan = require('../models/Laporan');
const Aktivitas = require('../models/Aktivitas');
const { kirimNotifikasi } = require('../utils/notifikasi');
const { catatAktivitas } = require('../utils/aktivitas');
const { safeSearchTerm, parsePagination, csvCell } = require('../utils/helpers');

const getAllKosAdmin = async (req, res, next) => {
  try {
    const { status, q, page, limit } = req.query;

    const filter = {};
    if (status) {
      filter.status_verifikasi = String(status).toLowerCase();
    }
    if (q) {
      const term = safeSearchTerm(q);
      filter.$or = [
        { nama: { $regex: term, $options: 'i' } },
        { alamat: { $regex: term, $options: 'i' } },
        { area_kampus: { $regex: term, $options: 'i' } },
      ];
    }

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 15);

    const totalData = await Kos.countDocuments(filter);
    const dataKos = await Kos.find(filter)
      .populate('pemilik_id', 'nama nomor_telepon email')
      .populate('diverifikasi_oleh', 'nama email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: dataKos.length,
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
      data: dataKos,
    });
  } catch (error) {
    next(error);
  }
};

const verifyKos = async (req, res, next) => {
  try {
    const { status_verifikasi, catatan_verifikasi } = req.body;

    if (!['approved', 'rejected'].includes(status_verifikasi)) {
      return res.status(400).json({
        success: false,
        message: 'Status verifikasi harus bernilai "approved" atau "rejected"',
      });
    }

    const kos = await Kos.findById(req.params.id);
    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    kos.status_verifikasi = status_verifikasi;
    kos.catatan_verifikasi = catatan_verifikasi || (status_verifikasi === 'approved' ? 'Data telah diverifikasi dan disetujui untuk tayang publik.' : 'Pendaftaran ditolak karena informasi belum memenuhi kriteria.');
    kos.diverifikasi_oleh = req.user._id;
    kos.diverifikasi_pada = new Date();

    const updatedKos = await kos.save();

    const disetujui = status_verifikasi === 'approved';
    await Promise.all([
      kirimNotifikasi(kos.pemilik_id, {
        tipe: disetujui ? 'kos_disetujui' : 'kos_ditolak',
        judul: disetujui ? `${kos.nama} disetujui` : `${kos.nama} perlu diperbaiki`,
        isi: kos.catatan_verifikasi,
        tautan: '/pemilik/kos',
      }),
      catatAktivitas({
        aktor: req.user,
        aksi: disetujui ? 'kos_disetujui' : 'kos_ditolak',
        targetTipe: 'kos',
        targetId: kos._id,
        targetLabel: kos.nama,
        ringkasan: `${req.user.nama} ${disetujui ? 'menyetujui' : 'menolak'} kos "${kos.nama}"`,
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Status kos berhasil diubah menjadi '${status_verifikasi}'`,
      data: updatedKos,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const kosStats = await Kos.aggregate([
      {
        $group: {
          _id: '$status_verifikasi',
          count: { $sum: 1 },
          totalKamarTersedia: { $sum: '$jumlah_kamar_tersedia' },
          totalKamarTotal: { $sum: '$jumlah_kamar_total' },
        },
      },
    ]);

    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const ringkasanKos = {
      totalKos: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalKamarTersedia: 0,
      totalKamarTotal: 0,
    };

    kosStats.forEach((stat) => {
      ringkasanKos.totalKos += stat.count;
      ringkasanKos[stat._id] = stat.count;
      ringkasanKos.totalKamarTersedia += stat.totalKamarTersedia;
      ringkasanKos.totalKamarTotal += stat.totalKamarTotal;
    });

    const ringkasanUser = {
      totalUsers: 0,
      admin: 0,
      pemilik: 0,
      pencari: 0,
    };

    userStats.forEach((u) => {
      ringkasanUser.totalUsers += u.count;
      ringkasanUser[u._id] = u.count;
    });

    const laporanStats = await Laporan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const ringkasanLaporan = { total: 0, terbuka: 0, diproses: 0, selesai: 0, ditolak: 0 };
    laporanStats.forEach((l) => {
      ringkasanLaporan.total += l.count;
      ringkasanLaporan[l._id] = l.count;
    });

    res.status(200).json({
      success: true,
      data: {
        kos: ringkasanKos,
        users: ringkasanUser,
        laporan: ringkasanLaporan,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { role, q } = req.query;
    const filter = {};
    if (role) filter.role = String(role).toLowerCase();
    if (q) {
      const term = safeSearchTerm(q);
      filter.$or = [
        { nama: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { nomor_telepon: { $regex: term, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const exportKosCSV = async (req, res, next) => {
  try {
    const dataKos = await Kos.find().populate('pemilik_id', 'nama email nomor_telepon');

    let csv = 'ID,Nama Kos,Tipe,Harga Per Bulan,Kamar Tersedia,Kamar Total,Status Verifikasi,Area Kampus,Alamat,Nama Pemilik,Kontak Pemilik\n';

    dataKos.forEach((k) => {
      const row = [
        k._id,
        k.nama,
        k.tipe,
        k.harga_per_bulan,
        k.jumlah_kamar_tersedia,
        k.jumlah_kamar_total,
        k.status_verifikasi,
        k.area_kampus,
        k.alamat,
        k.pemilik_id ? k.pemilik_id.nama : '',
        k.pemilik_id ? k.pemilik_id.nomor_telepon : '',
      ];
      csv += row.map(csvCell).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rekap_kos_singgah_sana.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

const getAllLaporan = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const filter = {};
    if (status) filter.status = String(status).toLowerCase();

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 15);

    const totalData = await Laporan.countDocuments(filter);
    const data = await Laporan.find(filter)
      .populate('pelapor_id', 'nama email nomor_telepon')
      .populate('kos_id', 'nama alamat status_verifikasi foto')
      .populate('ditangani_oleh', 'nama')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: data.length,
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
      data,
    });
  } catch (error) {
    next(error);
  }
};

const handleLaporan = async (req, res, next) => {
  try {
    const { status, catatan_admin } = req.body;

    if (!['diproses', 'selesai', 'ditolak'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status laporan harus bernilai "diproses", "selesai", atau "ditolak"',
      });
    }

    const laporan = await Laporan.findById(req.params.id);
    if (!laporan) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
    }

    laporan.status = status;
    if (catatan_admin !== undefined) laporan.catatan_admin = catatan_admin;
    laporan.ditangani_oleh = req.user._id;
    laporan.ditangani_pada = new Date();
    const updated = await laporan.save();

    const labelStatus = { diproses: 'sedang diproses', selesai: 'selesai ditangani', ditolak: 'ditolak' }[status];
    await Promise.all([
      kirimNotifikasi(laporan.pelapor_id, {
        tipe: 'laporan_ditangani',
        judul: `Laporanmu tentang ${laporan.kos_nama} ${labelStatus}`,
        isi: laporan.catatan_admin,
        tautan: '/pencari/notifikasi',
      }),
      catatAktivitas({
        aktor: req.user,
        aksi: `laporan_${status}`,
        targetTipe: 'laporan',
        targetId: laporan._id,
        targetLabel: laporan.kos_nama,
        ringkasan: `${req.user.nama} menandai laporan "${laporan.kos_nama}" sebagai ${status}`,
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Laporan berhasil diubah menjadi '${status}'`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const getAktivitas = async (req, res, next) => {
  try {
    const { page, limit, aksi } = req.query;

    const filter = {};
    if (aksi) filter.aksi = String(aksi);

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 20);

    const totalData = await Aktivitas.countDocuments(filter);
    const data = await Aktivitas.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    res.status(200).json({
      success: true,
      count: data.length,
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLaporan,
  handleLaporan,
  getAktivitas,
  getAllKosAdmin,
  verifyKos,
  getDashboardStats,
  getAllUsers,
  exportKosCSV,
};
