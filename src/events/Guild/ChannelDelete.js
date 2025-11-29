const { Event } = require("../../structures/index.js");

module.exports = class ChannelDelete extends Event {
	constructor(client, file) {
		super(client, file, { name: "channelDelete" });
	}

	async run(channel) {
		try {
			if (!channel.guild) return;
			this.client.serverStatsManager?.scheduleUpdate(channel.guild.id, 2000);
		} catch (_) {}
	}
};
