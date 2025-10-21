const { Event } = require("../../structures/index.js");

module.exports = class GuildMemberAdd extends Event {
  constructor(client, file) {
    super(client, file, { name: "guildMemberAdd" });
  }

  async run(member) {
    try {
      this.client.serverStatsManager?.scheduleUpdate(member.guild.id, 2000);
    } catch (_) {}
  }
};

