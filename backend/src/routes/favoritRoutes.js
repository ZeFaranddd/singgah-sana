const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const {
  tandaiFavorit,
  batalFavorit,
  lihatFavoritSaya,
} = require("../controllers/favoritController");

router.post("/", verifyToken, authorizeRoles("pencari"), tandaiFavorit);
router.delete("/:id", verifyToken, authorizeRoles("pencari"), batalFavorit);
router.get("/saya", verifyToken, authorizeRoles("pencari"), lihatFavoritSaya);

module.exports = router;
