const { Command } = require('../../structures/index.js');
const { checkCooldown, updateCooldown } = require('../../functions/function');
const chance = require('chance').Chance();
const moment = require('moment-timezone');
const emojiImage = require("../../utils/Emoji");

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

    run(client, ctx, args, color, emoji, language) {
        const dailyMessages = language.locales.get(language.defaultLocale)?.economyMessages?.dailyMessages;

        client.utils.getUser(ctx.author.id).then(user => {
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, dailyMessages.errors.noUser, color);
            }

            const verify = user.verification.verify.status === 'verified';
            const { coin, bank } = user.balance;
            const baseCoins = chance.integer({ min: 300000, max: 500000 });
            const baseExp = chance.integer({ min: 100, max: 150 });

            const bonusCoins = verify ? Math.floor(baseCoins * 0.20) : 0;
            const bonusExp = verify ? Math.floor(baseExp * 0.20) : 0;

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;
            const newBalance = coin + totalCoins;

            const now = moment().tz('Asia/Bangkok');
            const next5PM = now.isAfter(moment().tz('Asia/Bangkok').hour(17).minute(0).second(0))
                ? moment().tz('Asia/Bangkok').add(1, 'days').set({ hour: 17, minute: 0, second: 0 })
                : moment().tz('Asia/Bangkok').set({ hour: 17, minute: 0, second: 0 });

            const timeUntilNext5PM = moment.duration(next5PM.diff(now));

            // Check cooldown
            if (!checkCooldown(client, ctx.author.id, this.name.toLowerCase(), timeUntilNext5PM)) {
                const duration = moment.duration(next5PM.diff(now));
                const cooldownMessage = dailyMessages.cooldown.replace(
                    '%{time}',
                    `${Math.floor(duration.asHours())}hrs, ${Math.floor(duration.asMinutes()) % 60}mins, and ${Math.floor(duration.asSeconds()) % 60}secs`
                );
                const cooldownEmbed = client.embed().setColor(color.red).setDescription(cooldownMessage);
                return ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            // Update user's balance and experience
            user.balance.coin = newBalance;
            user.balance.bank = bank;
            user.profile.xp += totalExp;

            // Save the user document only once
            const saveUser = user.save();

            // Handle save operation
            saveUser.then(() => {
                updateCooldown(client, ctx.author.id, this.name.toLowerCase(), timeUntilNext5PM);

                let bonusMessage = '';
                if (bonusCoins > 0 || bonusExp > 0) {
                    bonusMessage = `\n**+20% Bonus**: ${client.utils.formatNumber(bonusCoins)} coins and ${client.utils.formatNumber(bonusExp)} XP`;
                }

                const embed = client.embed()
                    .setColor(color.main)
                    .setTitle(dailyMessages.title.replace('%{displayName}', ctx.author.displayName))
                    .setThumbnail(client.utils.emojiToImage(now.hour() >= 6 && now.hour() < 18 ? emoji.time.day : emoji.time.night))
                    .setDescription(
                        dailyMessages.success
                            .replace('%{coinEmote}', emoji.coin)
                            .replace('%{coin}', client.utils.formatNumber(baseCoins))
                            .replace('%{exp}', client.utils.formatNumber(baseExp))
                            .replace('%{bonusMessage}', bonusMessage)
                    )
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
                        iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
                    });

                return ctx.sendMessage({ embeds: [embed] });
            }).catch(error => {
                console.error('Error saving user document:', error);
                return client.utils.sendErrorMessage(client, ctx, dailyMessages.errors.fetchFail, color);
            });
        }).catch(error => {
            console.error('Error fetching user:', error);
            return client.utils.sendErrorMessage(client, ctx, dailyMessages.errors.fetchFail, color);
        });
    }
};
