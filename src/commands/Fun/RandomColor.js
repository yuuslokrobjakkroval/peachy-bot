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

    run(client, ctx) {
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}`;

        const embed = client.embed()
            .setColor(randomColor)
            .setTitle("Here's a random color for you!")
            .setDescription(`Color: ${randomColor}`)
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        ctx.sendMessage({ embeds: [embed] });
    }
};
