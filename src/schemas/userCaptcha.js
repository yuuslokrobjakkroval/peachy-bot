const { model, Schema } = require("mongoose");

const userCaptchaSchema = new Schema({
	Guild: String,
	User: String,
	Captcha: String,
});

module.exports = model("verifyCaptcha", userCaptchaSchema);
