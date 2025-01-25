const { Command } = require("../../structures/index.js");
const InviteTrackerSchema = require("../../schemas/inviteTracker");

module.exports = class CheckInvites extends Command {
  constructor(client) {
    super(client, {
      name: "invites",
      description: {
        content: "𝑫𝒊𝒔𝒑𝒍𝒂𝒚𝒔 𝒕𝒉𝒆 𝒕𝒐𝒕𝒂𝒍 𝒏𝒖𝒎𝒃𝒆𝒓 𝒐𝒇 𝒖𝒔𝒆𝒔 𝒇𝒐𝒓 𝒂𝒍𝒍 𝒊𝒏𝒗𝒊𝒕𝒆𝒔.",
        examples: ["invites"],
        usage: "invites",
      },
      category: "utility",
      aliases: [],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user to view the profile of",
          type: 6,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", emoji.searching)
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", emoji.searching)
      );
    }

    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.users.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        ctx.author;

    const guildId = ctx.guild.id;
    const userId = mention.id;

    InviteTrackerSchema.aggregate([
      {
        $match: {
          guildId, // Match current guild
          inviterId: userId, // Match specified user
        },
      },
      {
        $group: {
          _id: "$inviterId",
          totalUses: { $sum: "$uses" },
        },
      },
      {
        $project: {
          inviterId: "$_id",
          totalUses: 1,
        },
      },
    ])
      .then(async (getInvites) => {
        const userInvite = getInvites.find(
          (invite) => invite.inviterId === mention.id
        );
        const inviteMessage = userInvite
          ? `You currently have ****${userInvite.totalUses}**** invites`
          : "No invite data available for you.";

        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", "𝐈𝐍𝐕𝐈𝐓𝐄𝐒")
              .replace("%{mainRight}", emoji.mainRight) + inviteMessage
          )
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          })
          .setTimestamp();

        return ctx.isInteraction
          ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
          : await ctx.editMessage({ content: "", embeds: [embed] });
      })
      .catch((err) => {
        console.error(err);
        client.utils.sendErrorMessage(
          client,
          ctx,
          "An error occurred while fetching your invite data.",
          color
        );
      });
  }
};
