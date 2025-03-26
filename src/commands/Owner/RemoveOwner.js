const { Command } = require("../../structures/index.js");
const Owners = require("../../schemas/owner");
const globalEmoji = require("../../utils/Emoji");

module.exports = class RemoveOwner extends Command {
    constructor(client) {
        super(client, {
            name: "removeowner",
            description: {
                content: "Remove an owner from the bot.",
                examples: ["removeowner @user"],
                usage: "removeowner <user>",
            },
            category: "owner",
            aliases: ["ro"],
            args: true,
            permissions: {
                dev: true, // Restricts to developers
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser("user")
            : ctx.message.mentions.members.first() ||
            ctx.guild.members.cache.get(args[0]) ||
            args[0];

        const userId = typeof mention === "string" ? mention : mention.id;

        let userInfo;
        try {
            userInfo = await client.users.fetch(userId);
        } catch (error) {
            return client.utils.sendErrorMessage(client, ctx, "User not found", color);
        }

        try {
            // Check if the owner exists
            const existingOwner = await Owners.findOne({ "ownerInfo.id": userInfo.id });
            if (!existingOwner) {
                return client.utils.sendErrorMessage(client, ctx, "This user is not an owner!", color);
            }

            // Remove the owner
            await Owners.deleteOne({ id: userInfo.id });

            // Success embed
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    `${globalEmoji.result.tick} Removed **${userInfo.displayName}** from owners successfully.`
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error("Error removing owner:", error);
            return client.sendErrorMessage(client, ctx, "Failed to remove owner. Check logs for details.", color);
        }
    }
};