const { Command } = require("../../structures/index.js");
const Owners = require("../../schemas/owner");
const globalEmoji = require("../../utils/Emoji");

module.exports = class AddOwner extends Command {
    constructor(client) {
        super(client, {
            name: "addowner",
            description: {
                content: "Add an owner for the bot.",
                examples: ["addowner @user"],
                usage: "addowner <user>",
            },
            category: "owner",
            aliases: ["ao"],
            args: true,
            permissions: {
                dev: true,
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
            const existingOwner = await Owners.findOne({ "ownerInfo.id": userInfo.id });
            if (existingOwner) {
                return client.utils.sendErrorMessage(client, ctx, "This user is already an owner!", color);
            }

            await Owners.create({ ownerInfo: userInfo });

            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    `${globalEmoji.result.tick} Added **${userInfo.displayName}** as an owner successfully.`
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error("Error adding owner:", error);
            return client.sendErrorMessage(client, ctx, "Failed to add owner. Check logs for details.", color);
        }
    }
};