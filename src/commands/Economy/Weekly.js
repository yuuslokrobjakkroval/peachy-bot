const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');
const { checkCooldown, getCooldown, updateCooldown } = require('../../functions/function');
const moment = require("moment-timezone");
const chance = require('chance').Chance();
const emojiImage = require("../../utils/Emoji");

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

    async run(client, ctx, args, color, emoji, language) {
        try {
            const weeklyMessages = language.locales.get(language.defaultLocale)?.economyMessages?.weeklyMessages; // Access messages
            const user = await Users.findOne({ userId: ctx.author.id }).exec();
            const verify = user.verification.verify.status === 'verified';

            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, weeklyMessages.userNotFound, color);
            }

            const { coin, bank } = user.balance;
            const baseCoins = chance.integer({ min: 500000, max: 1000000 });
            const newBalance = coin + baseCoins;

            const now = moment().tz('Asia/Bangkok');
            const nextWeekly = moment(now).add(1, 'week').toDate(); // Calculate next weekly

            const timeUntilNextWeekly = nextWeekly - now.toDate();
            const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly);

            if (!isCooldownExpired) {
                const lastCooldownTimestamp = await getCooldown(ctx.author.id, this.name.toLowerCase());
                const remainingTime = Math.ceil((lastCooldownTimestamp + timeUntilNextWeekly - Date.now()) / 1000);
                const cooldownMessage = this.getCooldownMessage(remainingTime, client, language, weeklyMessages); // Updated call

                const cooldownEmbed = client
                    .embed()
                    .setColor(color.red)
                    .setDescription(cooldownMessage);

                return await ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            const baseExp = chance.integer({ min: 200, max: 250 });
            const newExp = user.profile.xp + baseExp;

            await Promise.all([
                Users.updateOne({ userId: ctx.author.id }, {
                    $set: {
                        'balance.coin': newBalance,
                        'balance.bank': bank,
                        'profile.xp': newExp,
                    }
                }).exec(),
                updateCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly)
            ]);

            const embed = this.createSuccessEmbed(client, ctx, emoji, baseCoins, baseExp, now, weeklyMessages, verify); // Pass weeklyMessages
            return await ctx.sendMessage({ embeds: [embed] });

        } catch (error) {
            console.error('Error processing weekly command:', error);
            return client.utils.sendErrorMessage(client, ctx, weeklyMessages.error, color);
        }
    }

    getCooldownMessage(remainingTime, client, language, weeklyMessages) {
        const days = Math.floor(remainingTime / 86400);
        const hours = Math.floor((remainingTime % 86400) / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;

        // Pluralization logic for each time unit
        const daysString = days > 1 ? `${days} days` : `${days} day`;
        const hoursString = hours > 1 ? `${hours} hrs` : `${hours} hr`;
        const minutesString = minutes > 1 ? `${minutes} mins` : `${minutes} min`;
        const secondsString = seconds > 1 ? `${seconds} secs` : `${seconds} sec`;

        if (days > 1) {
            return weeklyMessages.cooldown.multipleDays
                .replace('{{days}}', daysString)
                .replace('{{hours}}', hoursString)
                .replace('{{minutes}}', minutesString)
                .replace('{{seconds}}', secondsString);
        } else if (days === 1) {
            return weeklyMessages.cooldown.singleDay
                .replace('{{days}}', daysString)
                .replace('{{hours}}', hoursString)
                .replace('{{minutes}}', minutesString)
                .replace('{{seconds}}', secondsString);
        } else {
            return weeklyMessages.cooldown.noDays
                .replace('{{hours}}', hoursString)
                .replace('{{minutes}}', minutesString)
                .replace('{{seconds}}', secondsString);
        }
    }

    createSuccessEmbed(client, ctx, emoji, baseCoins, baseExp, now, weeklyMessages, verify) {
        return client
            .embed()
            .setColor(client.config.color.main)
            .setTitle(`${ctx.author.displayName} claimed their weekly reward!`)
            .setThumbnail(client.utils.emojiToImage(`${now.hour() >= 6 && now.hour() < 18 ? `${emoji.time.day}` : `${emoji.time.night}`}`))
            .setDescription(
                weeklyMessages.success.replace('{{coinEmote}}', emoji.coin)
                    .replace('{{user}}', ctx.author.displayName)
                    .replace('{{coin}}', client.utils.formatNumber(baseCoins))
                    .replace('{{exp}}', client.utils.formatNumber(baseExp))
            )
            .setFooter({
                text: `Request By ${ctx.author.displayName}`,
                iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
            })
    }
};
