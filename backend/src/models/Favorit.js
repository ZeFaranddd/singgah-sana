const mongoose = require('mongoose');

const favoritSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kos_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kos',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

favoritSchema.index({ user_id: 1, kos_id: 1 }, { unique: true });

module.exports = mongoose.model('Favorit', favoritSchema);
