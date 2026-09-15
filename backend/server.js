require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const kosRoutes = require("./src/routes/kosRoutes");
const favoritRoutes = require("./src/routes/favoritRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.json({ message: "API Portal Informasi Kos berjalan" });
});

app.use("/api/auth", authRoutes);
app.use("/api/kos", kosRoutes);
app.use("/api/favorit", favoritRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Rute tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
