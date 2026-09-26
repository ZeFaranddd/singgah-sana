const Kos = require('../models/Kos');

const getAllKosPublic = async (req, res, next) => {
  try {
    const {
      q,
      tipe,
      harga_min,
      harga_max,
      fasilitas,
      kamar_tersedia,
      area_kampus,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { status_verifikasi: 'approved' };

    if (q) {
      filter.$or = [
        { nama: { $regex: q, $options: 'i' } },
        { alamat: { $regex: q, $options: 'i' } },
        { area_kampus: { $regex: q, $options: 'i' } },
        { deskripsi: { $regex: q, $options: 'i' } },
      ];
    }

    if (tipe) {
      filter.tipe = tipe.toLowerCase();
    }

    if (area_kampus) {
      filter.area_kampus = { $regex: area_kampus, $options: 'i' };
    }

    if (harga_min || harga_max) {
      filter.harga_per_bulan = {};
      if (harga_min) filter.harga_per_bulan.$gte = Number(harga_min);
      if (harga_max) filter.harga_per_bulan.$lte = Number(harga_max);
    }

    if (kamar_tersedia === 'true') {
      filter.jumlah_kamar_tersedia = { $gt: 0 };
    }

    if (fasilitas) {
      const fasList = fasilitas.split(',').map((f) => new RegExp(f.trim(), 'i'));
      filter.fasilitas = { $all: fasList };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'harga_asc') sortOptions = { harga_per_bulan: 1 };
    if (sort === 'harga_desc') sortOptions = { harga_per_bulan: -1 };
    if (sort === 'kamar_banyak') sortOptions = { jumlah_kamar_tersedia: -1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalData = await Kos.countDocuments(filter);
    const dataKos = await Kos.find(filter)
      .populate('pemilik_id', 'nama nomor_telepon email')
      .sort(sortOptions)
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

const getKosById = async (req, res, next) => {
  try {
    const kos = await Kos.findById(req.params.id).populate(
      'pemilik_id',
      'nama nomor_telepon email foto_profil'
    );

    if (!kos) {
      return res.status(404).json({
        success: false,
        message: 'Kos tidak ditemukan',
      });
    }

    if (kos.status_verifikasi !== 'approved') {
      const user = req.user;
      const isOwner = user && kos.pemilik_id._id.toString() === user._id.toString();
      const isAdmin = user && user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Kos ini masih dalam proses peninjauan verifikasi admin dan belum dipublikasikan.',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: kos,
    });
  } catch (error) {
    next(error);
  }
};

const createKos = async (req, res, next) => {
  try {
    const {
      nama,
      deskripsi,
      alamat,
      area_kampus,
      latitude,
      longitude,
      harga_per_bulan,
      tipe,
      fasilitas,
      luas_kamar,
      peraturan,
      jumlah_kamar_total,
      jumlah_kamar_tersedia,
      foto_urls,
    } = req.body;

    if (!nama || !deskripsi || !alamat || !harga_per_bulan || !tipe || !jumlah_kamar_total) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi field wajib: nama, deskripsi, alamat, harga_per_bulan, tipe, jumlah_kamar_total',
      });
    }

    let daftarFoto = [];
    if (req.files && req.files.length > 0) {
      daftarFoto = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (foto_urls) {
      daftarFoto = Array.isArray(foto_urls) ? foto_urls : [foto_urls];
    } else {
      daftarFoto = [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      ];
    }

    let parsedFasilitas = [];
    if (fasilitas) {
      parsedFasilitas = Array.isArray(fasilitas) ? fasilitas : fasilitas.split(',').map((f) => f.trim());
    }

    let parsedPeraturan = ['Akses 24 Jam', 'Dilarang Merokok di Kamar'];
    if (peraturan) {
      parsedPeraturan = Array.isArray(peraturan) ? peraturan : peraturan.split(',').map((p) => p.trim());
    }

    const kosBaru = await Kos.create({
      nama,
      deskripsi,
      alamat,
      area_kampus: area_kampus || 'Sekitar UGM',
      koordinat: {
        latitude: Number(latitude) || -7.7681,
        longitude: Number(longitude) || 110.3779,
      },
      foto: daftarFoto,
      harga_per_bulan: Number(harga_per_bulan),
      tipe: tipe.toLowerCase(),
      fasilitas: parsedFasilitas,
      luas_kamar: luas_kamar || '3x4 meter',
      peraturan: parsedPeraturan,
      jumlah_kamar_total: Number(jumlah_kamar_total),
      jumlah_kamar_tersedia:
        jumlah_kamar_tersedia !== undefined
          ? Number(jumlah_kamar_tersedia)
          : Number(jumlah_kamar_total),
      status_verifikasi: 'pending',
      pemilik_id: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Kos berhasil didaftarkan dan sedang menunggu verifikasi oleh Administrator',
      data: kosBaru,
    });
  } catch (error) {
    next(error);
  }
};

const getMyKos = async (req, res, next) => {
  try {
    const listKos = await Kos.find({ pemilik_id: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: listKos.length,
      data: listKos,
    });
  } catch (error) {
    next(error);
  }
};

const updateKos = async (req, res, next) => {
  try {
    let kos = await Kos.findById(req.params.id);

    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    if (kos.pemilik_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda hanya dapat memperbarui kos milik Anda sendiri',
      });
    }

    const {
      nama,
      deskripsi,
      alamat,
      area_kampus,
      latitude,
      longitude,
      harga_per_bulan,
      tipe,
      fasilitas,
      luas_kamar,
      peraturan,
      jumlah_kamar_total,
      jumlah_kamar_tersedia,
    } = req.body;

    if (nama) kos.nama = nama;
    if (deskripsi) kos.deskripsi = deskripsi;
    if (alamat) kos.alamat = alamat;
    if (area_kampus) kos.area_kampus = area_kampus;
    if (latitude && longitude) {
      kos.koordinat = { latitude: Number(latitude), longitude: Number(longitude) };
    }
    if (harga_per_bulan) kos.harga_per_bulan = Number(harga_per_bulan);
    if (tipe) kos.tipe = tipe.toLowerCase();
    if (luas_kamar) kos.luas_kamar = luas_kamar;
    if (fasilitas) {
      kos.fasilitas = Array.isArray(fasilitas) ? fasilitas : fasilitas.split(',').map((f) => f.trim());
    }
    if (peraturan) {
      kos.peraturan = Array.isArray(peraturan) ? peraturan : peraturan.split(',').map((p) => p.trim());
    }
    if (jumlah_kamar_total !== undefined) kos.jumlah_kamar_total = Number(jumlah_kamar_total);
    if (jumlah_kamar_tersedia !== undefined) {
      kos.jumlah_kamar_tersedia = Number(jumlah_kamar_tersedia);
    }

    const updatedKos = await kos.save();

    res.status(200).json({
      success: true,
      message: 'Data kos berhasil diperbarui',
      data: updatedKos,
    });
  } catch (error) {
    next(error);
  }
};

const deleteKos = async (req, res, next) => {
  try {
    const kos = await Kos.findById(req.params.id);

    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    if (kos.pemilik_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda tidak memiliki izin untuk menghapus kos ini',
      });
    }

    await kos.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Kos berhasil dihapus dari sistem',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllKosPublic,
  getKosById,
  createKos,
  getMyKos,
  updateKos,
  deleteKos,
};
