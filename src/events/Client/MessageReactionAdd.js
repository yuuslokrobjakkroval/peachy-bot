const { Event } = require("../../structures/index.js"); // Adjust the path as needed

module.exports = class MessageReactionAdd extends Event {
	constructor(client, file) {
		super(client, file, {
			name: "messageReactionAdd",
		});
	}

	async run(reaction, user) {
		if (user.bot) return;
	}
};
