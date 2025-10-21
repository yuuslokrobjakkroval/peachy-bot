const { Event } = require("../../structures/index.js");

module.exports = class GuildMemberUpdate extends Event {
  constructor(client, file) {
    super(client, file, { name: "guildMemberUpdate" });
  }

  async run(_oldMember, newMember) {
    try {
      this.client.serverStatsManager?.scheduleUpdate(newMember.guild.id, 2000);
    } catch (_) {}
  }
};

