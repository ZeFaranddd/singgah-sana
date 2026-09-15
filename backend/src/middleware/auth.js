const jwt = require("jsonwebtoken");

// Memastikan request memiliki token valid
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa" });
  }
}

// Membatasi akses berdasarkan role tertentu
// Contoh pemakaian: authorizeRoles("admin") atau authorizeRoles("pemilik", "admin")
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak untuk role ini" });
    }
    next();
  };
}

module.exports = { verifyToken, authorizeRoles };
