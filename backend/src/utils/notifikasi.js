const Notifikasi = require('../models/Notifikasi');
const User = require('../models/User');

/**
 * Membuat notifikasi untuk satu pengguna.
 * Kegagalan membuat notifikasi tidak boleh menggagalkan aksi utama
 * (mis. mengirim pesan), jadi error hanya dicatat ke log.
 */
const kirimNotifikasi = async (userId, { tipe = 'info', judul, isi = '', tautan = '' }) => {
  try {
    if (!userId) return null;
    return await Notifikasi.create({ user_id: userId, tipe, judul, isi, tautan });
  } catch (error) {
    console.error(`[Notifikasi] Gagal membuat notifikasi: ${error.message}`);
    return null;
  }
};

/** Mengirim notifikasi yang sama ke seluruh admin. */
const kirimNotifikasiKeAdmin = async ({ tipe = 'info', judul, isi = '', tautan = '' }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length === 0) return [];
    return await Notifikasi.insertMany(
      admins.map((admin) => ({ user_id: admin._id, tipe, judul, isi, tautan }))
    );
  } catch (error) {
    console.error(`[Notifikasi] Gagal mengirim notifikasi ke admin: ${error.message}`);
    return [];
  }
};

module.exports = { kirimNotifikasi, kirimNotifikasiKeAdmin };
