const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");
const gif = require("../../utils/Gif");

module.exports = class Balance extends Command {
    constructor(client) {
        super(client, {
            name: 'balance',
            description: {
                content: 'Displays your balance and daily transfer/receive limits.',
                examples: ['balance'],
                usage: 'balance',
            },
            category: 'economy',
            aliases: ['bal', 'money', 'cash'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, language) {
        const thumbnail = [gif.catBalance, gif.bearBalance]
        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, 'User not found.');
            }
            const { coin = 0, bank = 0 } = user.balance;

            const embed = client
                .embed()
                .setTitle(`${ctx.author.displayName}'s Balance`)
                .setColor(client.color.main)
                .setThumbnail(client.utils.getRandomElement(thumbnail))
                .setDescription(
                    `**${client.emoji.coin} : \`${client.utils.formatNumber(coin)} coins\`\n${client.emoji.bank} : \`${client.utils.formatNumber(bank)} coins\`**`
                )

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Balance command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while fetching the balance.');
        }
    }
};
