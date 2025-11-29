const { Event } = require("../../structures/index.js");

module.exports = class RoleCreate extends Event {
	constructor(client, file) {
		super(client, file, { name: "roleCreate" });
	}

	async run(role) {
		try {
			this.client.serverStatsManager?.scheduleUpdate(role.guild.id, 2000);
		} catch (_) {}
	}
};
