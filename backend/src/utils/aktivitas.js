const Aktivitas = require('../models/Aktivitas');

/**
 * Mencatat satu baris riwayat aktivitas.
 * Sama seperti notifikasi: kegagalan mencatat tidak boleh menggagalkan aksi utama.
 *
 * @param {object} param
 * @param {object|null} param.aktor dokumen User pelaku (null = sistem)
 * @param {string} param.aksi kode aksi, mis. 'kos_disetujui'
 * @param {'kos'|'laporan'|'user'|'lainnya'} param.targetTipe
 * @param {object|string|null} param.targetId
 * @param {string} param.targetLabel nama yang tampil, mis. nama kos
 * @param {string} param.ringkasan kalimat yang tampil di daftar aktivitas
 */
const catatAktivitas = async ({
  aktor = null,
  aksi,
  targetTipe = 'lainnya',
  targetId = null,
  targetLabel = '',
  ringkasan,
}) => {
  try {
    return await Aktivitas.create({
      aktor_id: aktor ? aktor._id : null,
      aktor_nama: aktor ? aktor.nama : 'Sistem',
      aktor_role: aktor ? aktor.role : 'sistem',
      aksi,
      target_tipe: targetTipe,
      target_id: targetId || null,
      target_label: targetLabel,
      ringkasan,
    });
  } catch (error) {
    console.error(`[Aktivitas] Gagal mencatat aktivitas: ${error.message}`);
    return null;
  }
};

module.exports = { catatAktivitas };
