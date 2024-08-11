const config = require("../../config.js");
const { Event } = require("../../structures/index.js");
const { checkBirthdays } = require('../../functions/function');

class Ready extends Event {
  constructor(client, file) {
    super(client, file, {
      name: "ready",
    });
  }

  async run() {
    this.client.logger.success(`${this.client.user?.tag} is ready!`);
    this.client.user?.setPresence({
      activities: [
        {
          name: config.botActivity,
          type: config.botActivityType,
        },
      ],
      status: config.botStatus,
    });

    await checkBirthdays(this.client);
  }
}

module.exports = Ready;