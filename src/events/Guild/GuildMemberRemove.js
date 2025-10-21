const { Event } = require("../../structures/index.js");

module.exports = class GuildMemberRemove extends Event {
  constructor(client, file) {
    super(client, file, { name: "guildMemberRemove" });
  }

  async run(member) {
    try {
      this.client.serverStatsManager?.scheduleUpdate(member.guild.id, 2000);
    } catch (_) {}
  }
};

