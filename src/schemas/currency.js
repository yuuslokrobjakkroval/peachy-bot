const { model, Schema } = require("mongoose");

const CurrencySchema = new Schema({
  userId: String,
  balance: { type: Number, default: 500 },
  bank: { type: Number, default: 0 },
  bankSpace: { type: Number, default: 5000 },
});
module.exports = model("Currency", CurrencySchema);