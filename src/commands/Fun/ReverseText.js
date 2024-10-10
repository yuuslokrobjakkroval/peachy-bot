const { Command } = require("../../structures/index.js");

module.exports = class ReverseText extends Command {
    constructor(client) {
        super(client, {
            name: "reverse",
            description: {
                content: "Reverse the text you provide",
                examples: ["reverse Hello"],
                usage: "reverse <text>",
            },
            category: "fun",
            aliases: ["fliptext", "rt"],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "text",
                    description: "The text to reverse",
                    type: 3, // STRING type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const text = ctx.isInteraction ? ctx.interaction.options.getString('text') : args.join(" ");
        const reversedText = text.split("").reverse().join("");

        // Get localized strings
        const reverseTextStrings = language.locales.get(language.defaultLocale)?.funMessage?.reverseText;

        const embed = client.embed()
            .setColor(color.main)
            .setTitle(reverseTextStrings.title) // Use localized title
            .setDescription(reverseTextStrings.description.replace("{originalText}", text).replace("{reversedText}", reversedText)) // Use localized description with placeholders
            .setFooter({
                text: `${reverseTextStrings.requestedBy} ${ctx.author.displayName}`, // Use localized footer text
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        await ctx.sendMessage({ embeds: [embed] });
    }
};
