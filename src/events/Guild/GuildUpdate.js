const { Event } = require("../../structures/index.js");

module.exports = class GuildUpdate extends Event {
	constructor(client, file) {
		super(client, file, { name: "guildUpdate" });
	}

	async run(_oldGuild, newGuild) {
		try {
			this.client.serverStatsManager?.scheduleUpdate(newGuild.id, 2000);
		} catch (_) {}
	}
};
