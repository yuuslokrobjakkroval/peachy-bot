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
        .setTitle(`𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍!`)
        .setDescription(
            `${client.user.username} is your multi-purpose Discord bot designed for fun, entertainment, and utility. With ${client.user.username} features, you can go mining, try your luck at gambling, play mini-games, and much more!`
        )
        .addFields([
          {
            name: '𝐎𝐖𝐍𝐄𝐑',
            value: `[𝓓𝓓 𝓗𝓤𝓖𝓜𝓔👑🖤](https://discord.gg/1006597979932725320)`,
            inline: false,
          },
          {
            name: '𝐃𝐄𝐕',
            value: `[𝓓𝓐𝓓𝓓𝓨 𝓚𝓨𝓤𝓤](https://discord.gg/966688007493140591)`,
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
