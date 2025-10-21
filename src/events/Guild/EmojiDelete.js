const { Event } = require("../../structures/index.js");

module.exports = class EmojiDelete extends Event {
  constructor(client, file) {
    super(client, file, { name: "emojiDelete" });
  }

  async run(emoji) {
    try {
      this.client.serverStatsManager?.scheduleUpdate(emoji.guild.id, 2000);
    } catch (_) {}
  }
};

