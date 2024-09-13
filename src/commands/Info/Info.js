const { Command } = require("../../structures/index.js");
const {ActionRowBuilder, ButtonBuilder} = require("discord.js");

module.exports = class Info extends Command {
  constructor(client) {
    super(client, {
      name: "info",
      description: {
        content: "Information about the bot and its features",
        examples: ["info"],
        usage: "info",
      },
      category: "info",
      aliases: ["botinfo", "bi"],
      cooldown: 3,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [],
    });
  }

  async run(client, ctx) {
    const embed = this.client
        .embed()
        .setColor(this.client.color.main)
        .setTitle(`${client.emoji.mainLeft} 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍! ${client.emoji.mainRight}`)
        .setDescription(
            `${client.user.username} is your multi-purpose Discord bot designed for fun, entertainment, and utility. With ${client.user.username} features, you can go mining, try your luck at gambling, play mini-games, and much more!`
        )
        .addFields([
          {
            name: '𝐃𝐄𝐕',
            value: `[𝐏𝐄𝐀𝐂𝐇𝐘 𝐓𝐄𝐀𝐌](https://discord.gg/PPuhSbgF6d)`,
            inline: false,
          },
          {
            name: '𝐆𝐑𝐀𝐏𝐇𝐈𝐂 𝐃𝐄𝐒𝐈𝐆𝐍',
            value: `[𝐙𝐄𝐄𝐋𝐄𝐄](https://discord.com/users/845918847482724363)`,
            inline: false,
          },
          {
            name: '𝐒𝐔𝐏𝐏𝐎𝐑𝐓𝐄𝐑',
            value: `[𝐇𝐔𝐆𝐌𝐄](https://discord.com/users/1006597979932725320)`,
            inline: false,
          },
        ])
        .setFooter({ text: 'Having any issues, need help, or want to report bugs? Clicking the link below' });
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Click for support').setStyle(5).setURL(client.config.links.support),
        new ButtonBuilder().setLabel('Invite Me!').setStyle(5).setURL(client.config.links.invite),
        new ButtonBuilder().setLabel('Vote for Me').setStyle(5).setURL(client.config.links.vote)
    );

    return await ctx.sendMessage({ embeds: [embed], components: [row] });
  }
}
