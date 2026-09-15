const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const {
  tambahKos,
  lihatKosSaya,
  editKos,
  hapusKos,
  lihatKosPending,
  verifikasiKos,
  listKosPublik,
  detailKos,
} = require("../controllers/kosController");

// ----- Rute PUBLIK (pencari & pengunjung umum) -----
router.get("/", listKosPublik);          // GET /api/kos
router.get("/:id", detailKos);           // GET /api/kos/:id  (harus di bawah rute spesifik lain agar tidak konflik)

// ----- Rute PEMILIK -----
router.post("/", verifyToken, authorizeRoles("pemilik"), tambahKos);
router.get("/saya/list", verifyToken, authorizeRoles("pemilik"), lihatKosSaya);
router.put("/:id", verifyToken, authorizeRoles("pemilik"), editKos);
router.delete("/:id", verifyToken, authorizeRoles("pemilik"), hapusKos);

// ----- Rute ADMIN -----
router.get("/admin/pending", verifyToken, authorizeRoles("admin"), lihatKosPending);
router.patch("/:id/verifikasi", verifyToken, authorizeRoles("admin"), verifikasiKos);

module.exports = router;
