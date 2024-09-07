const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class RemoveMoney extends Command {
    constructor(client) {
        super(client, {
            name: 'removemoney',
            description: {
                content: 'Remove coin from user.',
                examples: ['removemoney @user 100'],
                usage: 'removemoney <user> <amount>',
            },
            category: 'developer',
            aliases: ['rm'],
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
        const mention = ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
        const user = await Users.findOne({ userId: mention.id });
        const { coin, bank } = user.balance;

        if (mention.bot) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'mention_to_bot'));

        let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[1] || 1;
        if (isNaN(amount) || amount < 1 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: coin, half: Math.ceil(coin / 2) };
            const multiplier = { k: 1000, m: 1000000, b: 1000000000 };

            if (amount in amountMap) amount = amountMap[amount];
            else if (amount.match(/\d+[kmbtq]/)) {
                const unit = amount.slice(-1).toLowerCase();
                const number = parseInt(amount);
                amount = number * (multiplier[unit] || 1);
            } else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(client.color.red).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
                    ],
                });
            }
        }

        const baseCoins = parseInt(Math.min(amount));
        const newCoin = coin - baseCoins;

        const embed = client
            .embed()
            .setColor(client.color.main)
            .setDescription(
                `${client.emoji.tick} Removed **\`${client.utils.formatNumber(baseCoins)}\`** ${client.emoji.coin} to ${mention} balance.`
            );

        await Promise.all([
            Users.updateOne({ userId: mention.id }, { $set: { 'balance.coin': newCoin, 'balance.bank': bank } }).exec(),
        ]);

        return await ctx.sendMessage({ embeds: [embed] });
    }
};

