const { Command } = require("../../structures/index.js");
const User = require("../../schemas/user.js"); // Adjust path as necessary

class LightMode extends Command {
    constructor(client) {
        super(client, {
            name: "lightmode",
            description: {
                content: "Set your theme to light mode",
                examples: ["lightmode"],
                usage: "lightmode",
            },
            category: "utility",
            aliases: ["lm"],
            cooldown: 3,
            args: false,
            player: {
                voice: false,
                dj: false,
                active: false,
                djPerm: null,
            },
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel"],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx) {
        await User.findOneAndUpdate(
            { userId: ctx.author.id },
            { 'preferences.theme': 'light' },
            { new: true, upsert: true }
        );

        return await ctx.sendMessage('Light mode activated! ☀️');
    }
}

module.exports = LightMode;
