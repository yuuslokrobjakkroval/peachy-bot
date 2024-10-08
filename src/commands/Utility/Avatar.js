const { Command } = require("../../structures/index.js");

module.exports = class Avatar extends Command {
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

  async run(client, ctx, args, color, emoji, language) {
    const user = ctx.isInteraction
        ? ctx.interaction.options.getUser('user')
        : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

    if (!user) {
      const errorMessage = 'No user mentioned';
      return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
    }

    const embed = client.embed()
      .setColor(color.main)
      .setTitle(`Avatar of ${user.displayName}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter({
        text: `Requested by ${ctx.author.displayName}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    await ctx.sendMessage({ embeds: [embed] });
  }
}
