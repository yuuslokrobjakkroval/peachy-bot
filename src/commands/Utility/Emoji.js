const { Command } = require("../../structures/index.js");
const { MessageEmbed } = require("discord.js");

module.exports = class Emoji extends Command {
    constructor(client) {
        super(client, {
            name: "emoji",
            description: {
                content: "Generate an emoji image from the server",
                examples: ["emoji :emoji:"],
                usage: "emoji <emoji>",
            },
            category: "utility",
            aliases: [],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "emoji",
                    description: "The emoji to display",
                    type: 3, // STRING type for emoji input
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const emojiInput = ctx.isInteraction
            ? ctx.interaction.options.getString('emoji')
            : args[0];

        // Regex to match emoji, both static and animated
        const emojiRegex = /<a?:(\w+):(\d+)>/; // Updated to capture both emoji name and ID
        const match = emojiInput.match(emojiRegex);

        if (!match) {
            return await client.utils.sendErrorMessage(client, ctx, "Invalid emoji provided.");
        }

        const isAnimated = emojiInput.startsWith("<a:");
        const emojiID = match[2];
        const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.${isAnimated ? 'gif' : 'png'}?size=1024&quality=lossless`;

        const embed = client.embed()
            .setColor(client.color.main)
            .setTitle("Emoji Image")
            .setDescription(`Here is the image of the emoji:`)
            .setImage(emojiURL)
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        ctx.sendMessage({ embeds: [embed] });
    }
};
