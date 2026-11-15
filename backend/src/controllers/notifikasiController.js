const Notifikasi = require('../models/Notifikasi');
const { parsePagination } = require('../utils/helpers');

const getMyNotifikasi = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const filter = { user_id: req.user._id };
    if (status === 'belum_dibaca') filter.dibaca = false;
    if (status === 'dibaca') filter.dibaca = true;

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 20);

    const [totalData, belumDibaca, data] = await Promise.all([
      Notifikasi.countDocuments(filter),
      Notifikasi.countDocuments({ user_id: req.user._id, dibaca: false }),
      Notifikasi.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      belum_dibaca: belumDibaca,
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

// Ringan: dipakai ikon lonceng di header untuk menampilkan jumlah notifikasi baru
const getJumlahBelumDibaca = async (req, res, next) => {
  try {
    const belumDibaca = await Notifikasi.countDocuments({ user_id: req.user._id, dibaca: false });
    res.status(200).json({ success: true, data: { belum_dibaca: belumDibaca } });
  } catch (error) {
    next(error);
  }
};

const tandaiDibaca = async (req, res, next) => {
  try {
    const notifikasi = await Notifikasi.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { dibaca: true },
      { new: true }
    );

    if (!notifikasi) {
      return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan' });
    }

    res.status(200).json({ success: true, message: 'Notifikasi ditandai sudah dibaca', data: notifikasi });
  } catch (error) {
    next(error);
  }
};

const tandaiSemuaDibaca = async (req, res, next) => {
  try {
    const hasil = await Notifikasi.updateMany(
      { user_id: req.user._id, dibaca: false },
      { dibaca: true }
    );

    res.status(200).json({
      success: true,
      message: 'Semua notifikasi ditandai sudah dibaca',
      data: { diperbarui: hasil.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

const hapusNotifikasi = async (req, res, next) => {
  try {
    const notifikasi = await Notifikasi.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!notifikasi) {
      return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan' });
    }

    res.status(200).json({ success: true, message: 'Notifikasi dihapus' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifikasi,
  getJumlahBelumDibaca,
  tandaiDibaca,
  tandaiSemuaDibaca,
  hapusNotifikasi,
};
