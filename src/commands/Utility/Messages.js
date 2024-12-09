const { Command } = require("../../structures/index.js");
const MessageTrackingSchema = require("../../schemas/messageTrack");

module.exports = class MessageTracker extends Command {
    constructor(client) {
        super(client, {
            name: "messages",
            description: {
                content: "Displays the total number of messages sent by a user.",
                examples: ["messages"],
                usage: "messages",
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
                description: 'The user to view the message count for',
                type: 6,
                required: true,
            }],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
        }

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        const guildId = ctx.guild.id;
        const userId = mention.id;

        try {
            // Check if the guild data exists
            let guildData = await MessageTrackingSchema.findOne({ guildId });
            if (!guildData) {
                // If the guild data doesn't exist, create a new document
                guildData = new MessageTrackingSchema({
                    guildId,
                    isActive: true,
                    message: [],
                });
                await guildData.save();
            }

            let userData = guildData.message.find(msg => msg.userId === userId);
            if (!userData) {
                userData = {
                    userId,
                    userName: mention.username,
                    messageCount: 0,
                    date: new Date(),
                };
                guildData.message.push(userData);
                await guildData.save();
            }

            const messageCount = userData.messageCount;

            const message = messageCount > 0
                ? `You have sent **${messageCount}** messages.`
                : "No messages tracked for you yet.";

            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace("%{mainLeft}", emoji.mainLeft)
                        .replace("%{title}", "𝐌𝐄𝐒𝐒𝐀𝐆𝐄𝐒")
                        .replace("%{mainRight}", emoji.mainRight) +
                    message
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                })
                .setTimestamp();

            return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
        } catch (err) {
            console.error(err);
            ctx.sendErrorMessage(
                client,
                ctx,
                "An error occurred while processing the message tracking data.",
                color
            );
        }
    }
};
