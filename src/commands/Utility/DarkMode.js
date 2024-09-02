const { Command } = require("../../structures/index.js");
const User = require("../../schemas/user.js"); // Adjust path as necessary

class DarkMode extends Command {
    constructor(client) {
        super(client, {
            name: "darkmode",
            description: {
                content: "Set your theme to dark mode",
                examples: ["darkmode"],
                usage: "darkmode",
            },
            category: "utility",
            aliases: ["dm"],
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
            { 'preferences.theme': 'dark' },
            { new: true, upsert: true }
        );

        return await ctx.sendMessage('Dark mode activated! 🌙');
    }
}

module.exports = DarkMode;
