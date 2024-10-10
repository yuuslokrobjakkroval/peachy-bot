const { Command } = require("../../structures/index.js");

module.exports = class RandomColor extends Command {
    constructor(client) {
        super(client, {
            name: "color",
            description: {
                content: "Generate and display a random color",
                examples: ["color"],
                usage: "color",
            },
            category: "fun",
            aliases: ["randomcolor", "rc"],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const randomColorStrings = language.locales.get(language.defaultLocale)?.funMessage?.randomColor; // Localized color strings
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}`;

        const embed = client.embed()
            .setColor(randomColor)
            .setTitle(randomColorStrings.title) // Use localized title
            .setDescription(randomColorStrings.description.replace("{color}", randomColor)) // Use localized description with dynamic color
            .setFooter({
                text: `${randomColorStrings.requestedBy} ${ctx.author.displayName}`, // Use localized footer text
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        await ctx.sendMessage({ embeds: [embed] });
    }
};
