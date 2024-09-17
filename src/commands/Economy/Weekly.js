const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');
const { checkCooldown, getCooldown, updateCooldown } = require('../../functions/function');
const moment = require("moment-timezone");
const chance = require('chance').Chance();

module.exports = class Weekly extends Command {
    constructor(client) {
        super(client, {
            name: 'weekly',
            description: {
                content: 'Earn some coins weekly.',
                examples: ['weekly'],
                usage: 'weekly',
            },
            category: 'economy',
            aliases: ['week'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, language) {
        try {
            const user = await Users.findOne({ userId: ctx.author.id }).exec();
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, 'User not found.');
            }

            const { coin, bank } = user.balance;
            const baseCoins = chance.integer({ min: 500000, max: 1000000 });
            const newBalance = coin + baseCoins;

            const now = moment().tz('Asia/Bangkok');
            const nextWeekly = new Date();
            nextWeekly.setDate(now.date() + 7);

            const timeUntilNextWeekly = nextWeekly - now;

            const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly);

            if (!isCooldownExpired) {
                const lastCooldownTimestamp = await getCooldown(ctx.author.id, this.name.toLowerCase());
                const remainingTime = Math.ceil((lastCooldownTimestamp + timeUntilNextWeekly - Date.now()) / 1000);
                const days = Math.floor(remainingTime / 86400);
                const hours = Math.floor((remainingTime % 86400) / 3600);
                const minutes = Math.floor((remainingTime % 3600) / 60);
                const seconds = remainingTime % 60;
                
                let cooldownMessage;
                if (days > 1) {
                    cooldownMessage = `Weekly is on cooldown!\nTry again after **${days} day${days > 1 ? 's' : ''} and ${hours}hr${hours > 1 ? 's' : ''}**, **${minutes}min${minutes > 1 ? 's' : ''}**, and **${seconds}sec${seconds > 1 ? 's' : ''}**.`;
                } else if (days === 1) {

                    cooldownMessage = `Weekly is on cooldown!\nTry again after **${days} day, ${hours}hr${hours > 1 ? 's' : ''}, ${minutes}min${minutes > 1 ? 's' : ''}, and ${seconds}sec${seconds > 1 ? 's' : ''}**.`;
                } else {
                    cooldownMessage = `Weekly is on cooldown!\nTry again after **${hours}hr${hours > 1 ? 's' : ''}, ${minutes}min${minutes > 1 ? 's' : ''}, and ${seconds}sec${seconds > 1 ? 's' : ''}**.`;
                }
                const cooldownEmbed = client
                    .embed()
                    .setColor(client.color.danger)
                    .setDescription(cooldownMessage);

                return await ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            await Promise.all([
                Users.updateOne({ userId: ctx.author.id }, {
                    $set: {
                        'balance.coin': newBalance,
                        'balance.bank': bank,
                    }
                }).exec(),
                updateCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly)
            ]);

            const embed = client
                .embed()
                .setColor(client.color.main)
                .setTitle(`${ctx.author.displayName} claimed their weekly reward!`)
                .setDescription(
                    client.i18n.get(language, 'commands', 'weekly_success', {
                        coinEmote: client.emoji.coin,
                        coin: client.utils.formatNumber(baseCoins),
                    })
                );

            return await ctx.sendMessage({ embeds: [embed] });

        } catch (error) {
            console.error('Error processing weekly command:', error);
            return client.utils.sendErrorMessage(client, ctx, 'There was an error processing your weekly claim.');
        }
    }
};