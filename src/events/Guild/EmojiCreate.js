const { Event } = require("../../structures/index.js");

module.exports = class EmojiCreate extends Event {
	constructor(client, file) {
		super(client, file, { name: "emojiCreate" });
	}

	async run(emoji) {
		try {
			this.client.serverStatsManager?.scheduleUpdate(emoji.guild.id, 2000);
		} catch (_) {}
	}
};
