const { Event } = require("../../structures/index.js");

module.exports = class RoleDelete extends Event {
	constructor(client, file) {
		super(client, file, { name: "roleDelete" });
	}

	async run(role) {
		try {
			this.client.serverStatsManager?.scheduleUpdate(role.guild.id, 2000);
		} catch (_) {}
	}
};
