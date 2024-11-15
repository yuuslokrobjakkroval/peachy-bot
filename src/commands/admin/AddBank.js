const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class AddBank extends Command {
    constructor(client) {
        super(client, {
            name: 'addbank',
            description: {
                content: "Add coin to a user's bank balance.",
                examples: ['addbank @user 100'],
                usage: 'addbank <user> <amount>',
            },
            category: 'developer',
            aliases: ['ab'],
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

    async run(client, ctx, args, color, emoji, language) {
        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
        let user = await Users.findOne({ userId: mention.id });
        if (!user) {
            user = new Users({
                userId: mention.id,
                balance: {
                    coin: 0,
                    bank: 0,
                }
            });
        }

        const { coin, bank } = user.balance;

        if (mention.bot) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'mention_to_bot'));

        let amount = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const multiplier = { k: 1000, m: 1000000, b: 1000000000 };
            if (amount.match(/\d+[kmbtq]/i)) {
                const unit = amount.slice(-1).toLowerCase();
                const number = parseInt(amount);
                amount = number * multiplier[unit];
            } else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('amount_instructions')
                                .setStyle(2)
                                .setLabel(client.i18n.get(language, 'commands', 'invalid_amount_button'))
                                .setDisabled(false)
                                .setEmoji('📕')
                        ),
                    ],
                });
            }
        }

        const baseCoins = parseInt(amount);
        const newBank = bank + baseCoins;

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                `${emoji.tick} Added **\`${client.utils.formatNumber(baseCoins)}\`** ${emoji.coin} to ${mention}'s bank balance.`
            );

        await Users.updateOne(
            { userId: mention.id },
            { $set: { 'balance.bank': newBank, 'balance.coin': coin } },
            { upsert: true }
        ).exec();

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
