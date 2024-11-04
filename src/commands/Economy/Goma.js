const { Command } = require('../../structures/index.js');
const chance = require('chance').Chance();
const moment = require('moment');
const emojiImage = require("../../utils/Emoji");

module.exports = class Goma extends Command {
    constructor(client) {
        super(client, {
            name: 'goma',
            description: {
                content: 'Earn some coins by being goma.',
                examples: ['goma'],
                usage: 'goma',
            },
            category: 'economy',
            aliases: ['g'],
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
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const gomaMessages = language.locales.get(language.defaultLocale)?.economyMessages?.gomaMessages;

        // Fetch user data using client.utils.getUser
        client.utils.getUser(ctx.author.id).then(user => {
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const baseCoins = chance.integer({ min: 400, max: 500 });
            const baseExp = chance.integer({ min: 5, max: 10 });

            let bonusCoins = 0;
            let bonusExp = 0;

            const verify = user.verification.verify.status === 'verified';
            if (verify) {
                bonusCoins = Math.floor(baseCoins * 0.20);
                bonusExp = Math.floor(baseExp * 0.20);
            }

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;
            const newBalance = user.balance.coin + totalCoins;
            const newExp = user.profile.xp + totalExp;
            const newStreak = user.goma.streak + 1;

            const cooldownTime = 300000; // 5 minutes cooldown
            client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime).then(isCooldownExpired => {
                if (!isCooldownExpired) {
                    client.utils.getCooldown(ctx.author.id, this.name.toLowerCase()).then(lastCooldownTimestamp => {
                        const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                        const duration = moment.duration(remainingTime, 'seconds');
                        const minutes = Math.floor(duration.asMinutes());
                        const seconds = Math.floor(duration.asSeconds()) % 60;

                        const cooldownMessage = gomaMessages.cooldown
                            .replace('%{minutes}', minutes)
                            .replace('%{seconds}', seconds);

                        const cooldownEmbed = client.embed()
                            .setColor(color.danger)
                            .setDescription(cooldownMessage);

                        return ctx.sendMessage({ embeds: [cooldownEmbed] });
                    });
                } else {
                    // Update balance and streak
                    user.balance.coin = newBalance;
                    user.profile.xp = newExp;
                    user.goma.streak = newStreak;

                    // Save the user data
                    user.save().then(() => {
                        client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);
                        let bonusMessage = '';
                        if (bonusCoins > 0 || bonusExp > 0) {
                            bonusMessage = `\n**+20% Bonus**\n${emoji.coin}: **+${client.utils.formatNumber(bonusCoins)}** coins\n${emoji.exp} **+${client.utils.formatNumber(bonusExp)}** xp`;
                        }

                        const successEmbed = client.embed()
                            .setColor(color.main)
                            .setDescription(
                                gomaMessages.success
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{mainRight}', emoji.mainRight)
                                    .replace('%{coinEmote}', emoji.coin)
                                    .replace('%{coin}', client.utils.formatNumber(baseCoins))
                                    .replace('%{expEmote}', emoji.exp)
                                    .replace('%{exp}', client.utils.formatNumber(baseExp))
                                    .replace('%{bonusMessage}', bonusMessage)
                            )
                            .setFooter({
                                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        return ctx.sendMessage({ embeds: [successEmbed] });
                    }).catch(error => {
                        console.error('Error saving user data:', error);
                        return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
                    });
                }
            }).catch(error => {
                console.error('Error checking cooldown:', error);
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
            });
        }).catch(error => {
            console.error('Error fetching user data:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        });
    }
};
