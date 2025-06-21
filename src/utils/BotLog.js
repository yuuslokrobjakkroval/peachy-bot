const { TextChannel } = require("discord.js");

module.exports = class BotLog {
  static async send(client, message, type) {
    if (!client) return;
    if (!client.channels.cache) return;
    if (!client.config.logChannelId) return;
    const channel = client.channels.cache.get(client.config.logChannelId);
    if (!channel || !(channel instanceof TextChannel)) return;

    let color;
    switch (type) {
      case "error":
        color = 0xff0000;
        break;
      case "warn":
        color = 0xffff00;
        break;
      case "info":
        color = 0x00ff00;
        break;
      case "success":
        color = 0x00ff00;
        break;
      default:
        color = 0x000000;
        break;
    }

    const embed = client
      .embed()
      .setColor(color)
      .setDescription(message)
      .setTimestamp();

    return await channel
      .send({ embeds: [embed] })
      .catch(() => console.error("Error sending log message"));
  }
};
