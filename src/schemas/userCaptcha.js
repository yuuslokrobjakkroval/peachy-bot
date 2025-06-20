const { model, Schema } = require("mongoose");

let userCaptchaSchema = new Schema({
  Guild: String,
  User: String,
  Captcha: String,
});

module.exports = model("verifyCaptcha", userCaptchaSchema);
