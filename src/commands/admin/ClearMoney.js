const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class ClearMoney extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmoney',
            description: {
                content: 'Clear coin from user.',
                examples: ['clearmoney @user 100'],
                usage: 'clearmoney <user> <amount>',
            },
            category: 'dev',
            aliases: ['cm'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, language) {
        const user = ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        if (user.bot) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'mention_to_bot'));

        const embed = client
            .embed()
            .setColor(client.color.main)
            .setDescription(`${client.emoji.tick} Cleared all money from ${user}'s balance.`);

        try {
            await Users.updateOne(
                { userId: user.id },
                { $set: { "balance.coin": 0, "balance.bank": 0 } }
            ).exec();

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (err) {
            return await client.utils.sendErrorMessage(client, ctx, "An error occurred while clearing the money.");
        }
    }
};
