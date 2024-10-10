const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');
const { checkCooldown, updateCooldown } = require('../../functions/function');
const chance = require('chance').Chance();
const moment = require('moment-timezone');

module.exports = class Daily extends Command {
    constructor(client) {
        super(client, {
            name: 'daily',
            description: {
                content: 'Earn some coins daily.',
                examples: ['daily'],
                usage: 'daily',
            },
            category: 'economy',
            aliases: ['daily'],
            cooldown: 5,
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

    async run(client, ctx, args, color, emoji, language) {
        try {
            const dailyMessages = language.locales.get(language.defaultLocale)?.economyMessages?.dailyMessages;
            const user = await Users.findOne({ userId: ctx.author.id }).exec();

            // User not found in the database
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, dailyMessages.errors.noUser, color);
            }

            const { coin, bank } = user.balance;
            const baseCoins = chance.integer({ min: 300000, max: 500000 });
            const newBalance = coin + baseCoins;

            // Get current time and determine the next 5 PM
            const now = moment().tz('Asia/Bangkok');
            const hours = now.hour();
            let nextDate = now.hour() >= 17 ? now.add(1, 'days') : now;
            const next5PM = nextDate.set({ hour: 17, minute: 0, second: 0, millisecond: 0 });
            const timeUntilNext5PM = moment.duration(next5PM.diff(now));

            // Check cooldown
            const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNext5PM);
            if (!isCooldownExpired) {
                const duration = moment.duration(next5PM.diff(now));
                const cooldownMessage = dailyMessages.cooldown.replace(
                    '%{time}',
                    `${Math.floor(duration.asHours())}hrs, ${Math.floor(duration.asMinutes()) % 60}mins, and ${Math.floor(duration.asSeconds()) % 60}secs`
                );
                const cooldownEmbed = client.embed().setColor(color.red).setDescription(cooldownMessage);
                return await ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            // Calculate and update balance and experience
            const baseExp = chance.integer({ min: 100, max: 150 });
            const newExp = user.profile.xp + baseExp;

            await Promise.all([
                Users.updateOne({ userId: ctx.author.id }, {
                    $set: {
                        'balance.coin': newBalance,
                        'balance.bank': bank,
                        'profile.xp': newExp,
                    }
                }).exec(),
                updateCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNext5PM)
            ]);

            // Prepare the embed
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(dailyMessages.title.replace('%{displayName}', ctx.author.displayName))
                .setThumbnail(client.utils.emojiToImage(hours >= 6 && hours < 18 ? emoji.time.day : emoji.time.night))
                .setDescription(
                    dailyMessages.success
                        .replace('%{coinEmote}', emoji.coin)
                        .replace('%{coin}', client.utils.formatNumber(baseCoins))
                        .replace('%{exp}', client.utils.formatNumber(baseExp))
                );

            return await ctx.sendMessage({ embeds: [embed] });

        } catch (error) {
            console.error('Error processing daily command:', error);
            return client.utils.sendErrorMessage(client, ctx, dailyMessages.errors.fetchFail, color);
        }
    }
};
