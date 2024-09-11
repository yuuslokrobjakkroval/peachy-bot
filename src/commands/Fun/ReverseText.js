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

    async run(client, ctx, args) {
        const text = ctx.isInteraction ? ctx.interaction.options.getString('text') : args.join(" ");
        const reversedText = text.split("").reverse().join("");

        const embed = client.embed()
            .setColor(client.color.main)
            .setTitle("Reversed Text")
            .setDescription(`**Original Text:** ${text}\n**Reversed Text:** ${reversedText}`)
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        ctx.sendMessage({ embeds: [embed] });
    }
};
