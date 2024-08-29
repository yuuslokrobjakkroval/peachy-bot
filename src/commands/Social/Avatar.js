const { Command } = require("../../structures/index.js");
const { MessageEmbed } = require("discord.js");

class Avatar extends Command {
  constructor(client) {
    super(client, {
      name: "avatar",
      description: {
        content: "Displays a user's avatar",
        examples: ["avatar @User"],
        usage: "avatar [@User]",
      },
      category: "utility",
      aliases: ["av", "pfp"],
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
      options: [
        {
          name: "user",
          description: "The user to get the avatar of",
          type: 6, // USER type
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args) {
    const user = ctx.message.mentions.users.first() || client.users.cache.get(args[0]) || ctx.author;
    const embed = client.embed()
      .setColor(client.color.main)
      .setTitle(`Avatar of ${user.displayName}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter({
        text: `Requested by ${ctx.author.username}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
}

module.exports = Avatar;
