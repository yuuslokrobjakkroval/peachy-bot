const { Command } = require("../../structures/index.js");
const config = require("../../config.js");

class Avatar extends Command {
    constructor(client) {
        super(client, {
            name: "avatar",
            description: "Displays the avatar of the specified user.",
            category: "social",
            aliases: ["avatar"],
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
                    name: 'user',
                    description: 'The user whose avatar you want to see',
                    type: 6, // USER type
                    required: false,
                }
            ],
        });
    }

    async run(client, ctx, args) {
        try {
            const userId = args[0].replace(/[<@!>]/g, '');
            const mention = await client.users.fetch(userId);
            const user = mention ? mention : ctx.author;
            const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

            const embed = this.client.embed()
                .setColor(config.color.main)
                .setTitle(`**${user.globalName} Avatar**`)
                .setImage(avatarURL);

            ctx.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Avatar command error: ${error}`);
            ctx.channel.send("There was an error while executing this command.");
        }
    }
}

module.exports = Avatar;
