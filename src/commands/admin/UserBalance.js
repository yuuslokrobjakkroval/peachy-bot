const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const transferLimits = require('../../utils/transferReceiveLimitUtil.js');
const { formatNumber } = require('../../utils/Utils.js');

module.exports = class UserBalance extends Command {
    constructor(client) {
        super(client, {
            name: 'userbalance',
            description: {
                content: 'Displays a user\'s balance and daily transfer/receive limits.',
                examples: ['ubal @user'],
                usage: 'ubal <@user>',
            },
            category: 'developer',
            aliases: ['ubal'],
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'user',
                    description: 'The user you want to check.',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        try {
            const target = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

            const user = await Users.findOne({ userId: target.id });
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
                .setTitle(`${target.displayName}'s Balance and Limits`)
                .setColor(client.color.main)
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(
                    `**Coin: \`${client.utils.formatNumber(coin)}\`** ${client.emote.coin}\n` +
                    `**Bank: \`${client.utils.formatNumber(bank)}\`** ${client.emote.coin}`
                )
                .addFields([
                    {
                        name: 'Transferred (per day)',
                        value: `**\`${client.utils.formatNumber(sentToday)}\` / \`${client.utils.formatNumber(limits.send)}\`** ${client.emote.coin}`,
                        inline: true,
                    },
                    {
                        name: 'Received (per day)',
                        value: `**\`${client.utils.formatNumber(receivedToday)}\` / \`${client.utils.formatNumber(limits.receive)}\`** ${client.emote.coin}`,
                        inline: true,
                    }
                ]);

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in user balance command:', error);
            return await ctx.sendMessage({
                content: 'An error occurred while processing your request.',
            });
        }
    }
};
