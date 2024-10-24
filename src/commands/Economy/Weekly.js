const { Command } = require('../../structures/index.js');
const { checkCooldown, updateCooldown } = require('../../functions/function');
const chance = require('chance').Chance();
const moment = require('moment-timezone');
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

    run(client, ctx, args, color, emoji, language) {
        const weeklyMessages = language.locales.get(language.defaultLocale)?.economyMessages?.weeklyMessages;

        client.utils.getUser(ctx.author.id).then(user => {
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, weeklyMessages.userNotFound, color);
            }

            const verify = user.verification.verify.status === 'verified';
            const { coin, bank } = user.balance;

            const baseCoins = chance.integer({ min: 500000, max: 1000000 });
            const baseExp = chance.integer({ min: 200, max: 250 });

            const bonusCoins = verify ? Math.floor(baseCoins * 0.20) : 0;
            const bonusExp = verify ? Math.floor(baseExp * 0.20) : 0;

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;
            const newBalance = coin + totalCoins;

            const now = moment().tz('Asia/Bangkok');
            const nextWeekly = moment(now).add(1, 'week');
            const timeUntilNextWeekly = nextWeekly.diff(now);

            // Check cooldown
            if (!checkCooldown(client, ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly)) {
                const duration = moment.duration(nextWeekly.diff(now)); // Updated diff

                const days = Math.floor(duration.asDays());
                const hours = Math.floor(duration.asHours()) % 24;
                const minutes = Math.floor(duration.asMinutes()) % 60;
                const seconds = Math.floor(duration.asSeconds()) % 60;

                let cooldownMessage = '';

                if (days > 1) {
                    cooldownMessage = weeklyMessages.cooldown.multipleDays
                        .replace('{{days}}', `${days} days`)
                        .replace('{{hours}}', `${hours} hrs`)
                        .replace('{{minutes}}', `${minutes} mins`)
                        .replace('{{seconds}}', `${seconds} secs`);
                } else if (days === 1) {
                    cooldownMessage = weeklyMessages.cooldown.singleDay
                        .replace('{{days}}', `${days} day`)
                        .replace('{{hours}}', `${hours} hrs`)
                        .replace('{{minutes}}', `${minutes} mins`)
                        .replace('{{seconds}}', `${seconds} secs`);
                } else {
                    cooldownMessage = weeklyMessages.cooldown.noDays
                        .replace('{{hours}}', `${hours} hrs`)
                        .replace('{{minutes}}', `${minutes} mins`)
                        .replace('{{seconds}}', `${seconds} secs`);
                }

                const cooldownEmbed = client.embed().setColor(color.red).setDescription(cooldownMessage);
                return ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            // Update user's balance and experience
            user.balance.coin = newBalance;
            user.balance.bank = bank;
            user.profile.xp += totalExp;

            // Save the user document only once
            const saveUser = user.save();

            saveUser.then(() => {
                updateCooldown(client, ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly);

                let bonusMessage = '';
                if (bonusCoins > 0 || bonusExp > 0) {
                    bonusMessage = `\n**+20% Bonus**: ${client.utils.formatNumber(bonusCoins)} coins and ${client.utils.formatNumber(bonusExp)} XP`;
                }

                const embed = client.embed()
                    .setColor(color.main)
                    .setTitle(weeklyMessages.title.replace('%{displayName}', ctx.author.displayName))
                    .setThumbnail(client.utils.emojiToImage(now.hour() >= 6 && now.hour() < 18 ? emoji.time.day : emoji.time.night))
                    .setDescription(
                        weeklyMessages.success
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
                return client.utils.sendErrorMessage(client, ctx, weeklyMessages.error, color);
            });

        }).catch(error => {
            console.error('Error fetching user:', error);
            return client.utils.sendErrorMessage(client, ctx, weeklyMessages.error, color);
        });
    }
};
