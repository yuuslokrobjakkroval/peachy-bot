const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");
const transferLimits = require('../../utils/transferReceiveLimitUtil.js');

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
        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, 'User not found.');
            }

            const { balance = { coin: 0, bank: 0 }, dailyLimits = { lastReset: null, transferUsed: 0, receiveUsed: 0 } } = user;
            const { coin = 0, bank = 0 } = balance;
            const level = user.profile.level || 1;
            const limits = transferLimits.find(limit => limit.level === level) || { send: 0, receive: 0 };

            const today = new Date().setHours(0, 0, 0, 0);
            const resetDate = dailyLimits.lastReset ? new Date(dailyLimits.lastReset).setHours(0, 0, 0, 0) : null;

            let sentToday = 0;
            let receivedToday = 0;

            if (today === resetDate) {
                sentToday = dailyLimits.transferUsed || 0;
                receivedToday = dailyLimits.receiveUsed || 0;
            }

            const embed = client
                .embed()
                .setTitle(`${this.client.emoji.mainLeft} ${ctx.author.displayName}'s Balance ${this.client.emoji.mainRight}`)
                .setColor(client.color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(
                    `**Coin: \`${client.utils.formatNumber(coin)}\` ${client.emoji.coin}\nBank: \`${client.utils.formatNumber(bank)}\` ${client.emoji.coin}**`
                )
                .addFields([
                    {
                        name: 'Transferred (per day)',
                        value: `**\`${client.utils.formatNumber(sentToday)}\` / \`${client.utils.formatNumber(limits.send)}\`** ${client.emoji.coin}`,
                        inline: true,
                    },
                    {
                        name: 'Received (per day)',
                        value: `**\`${client.utils.formatNumber(receivedToday)}\` / \`${client.utils.formatNumber(limits.receive)}\`** ${client.emoji.coin}`,
                        inline: true,
                    }
                ]);

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Balance command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while fetching the balance.');
        }
    }
};
