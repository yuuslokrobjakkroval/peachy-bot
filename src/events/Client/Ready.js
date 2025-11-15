const { Event } = require("../../structures/index.js");
const globalConfig = require("../../utils/Config");
const BotLog = require("../../utils/BotLog.js");

module.exports = class Ready extends Event {
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
          name: `PEACHY IN UR AREA !!!`,
          type: globalConfig.botActivityType,
        },
      ],
      status: globalConfig.botStatus,
    });
    return await BotLog.send(
      this.client,
      `${this.client.user?.tag} is ready!`,
      "success"
    );
  }
};
