const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: pengguna belum diautentikasi',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: role '${req.user.role}' tidak memiliki izin untuk mengakses resource ini. Izin dibutuhkan: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { authorize };
