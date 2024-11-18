const { Command } = require("../../structures/index.js");
const InviteTrackerSchema = require("../../schemas/inviteTracker");

module.exports = class CheckInvites extends Command {
    constructor(client) {
        super(client, {
            name: "invites",
            description: {
                content: "Displays the total number of uses for all invites.",
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
            options: [{
                name: 'user',
                description: 'The user to view the profile of',
                type: 6,
                required: true,
            }],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search);
        } else {
            await ctx.sendDeferMessage(generalMessages.search);
        }

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        InviteTrackerSchema.aggregate([
            {
                $match: { inviterId: mention.id },
            },
            {
                $group: {
                    _id: '$inviterId',
                    totalUses: { $sum: '$uses' },
                },
            },
            {
                $project: {
                    inviterId: '$_id',
                    totalUses: 1,
                },
            },
        ])
            .then(async getInvites => {
                const userInvite = getInvites.find(invite => invite.inviterId === mention.id);
                const inviteMessage = userInvite
                    ? `You currently have **${userInvite.totalUses}** invites`
                    : "No invite data available for you.";

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        generalMessages.title
                        .replace("%{mainLeft}", emoji.mainLeft)
                        .replace("%{title}", "𝐈𝐍𝐕𝐈𝐓𝐄𝐒")
                        .replace("%{mainRight}", emoji.mainRight) +
                        inviteMessage
                    )
                    .setFooter({
                        text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    })
                    .setTimestamp();

                return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
            })
            .catch(err => {
                console.error(err);
                ctx.sendErrorMessage(
                    client,
                    ctx,
                    "An error occurred while fetching your invite data.",
                    color
                );
            });
    }
};
