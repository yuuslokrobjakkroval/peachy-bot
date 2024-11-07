const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');
const chance = require('chance').Chance();
const moment = require('moment');

module.exports = class Peachy extends Command {
    constructor(client) {
        super(client, {
            name: 'peachy',
            description: {
                content: 'Earn some coins by being peachy.',
                examples: ['peachy'],
                usage: 'peachy',
            },
            category: 'economy',
            aliases: ['eachy', 'each', 'p'],
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
        const peachyMessages = language.locales.get(language.defaultLocale)?.economyMessages?.peachyMessages;

        // Get user using client.utils
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
                bonusCoins = Math.floor(baseCoins * 0.40);
                bonusExp = Math.floor(baseExp * 0.40);
            }

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;
            const newBalance = user.balance.coin + totalCoins;
            const newExp = user.profile.xp + totalExp;
            const newStreak = user.peachy.streak + 1;

            const cooldownTime = 300000; // 5 minutes cooldown
            return client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime)
                .then(isCooldownExpired => {
                    if (!isCooldownExpired) {
                        return client.utils.getCooldown(ctx.author.id, this.name.toLowerCase())
                            .then(lastCooldownTimestamp => {
                                const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                                const duration = moment.duration(remainingTime, 'seconds');
                                const minutes = Math.floor(duration.asMinutes());
                                const seconds = Math.floor(duration.asSeconds()) % 60;

                                const cooldownMessage = peachyMessages.cooldown
                                    .replace('%{minutes}', minutes)
                                    .replace('%{seconds}', seconds);

                                const cooldownEmbed = client.embed()
                                    .setColor(color.danger)
                                    .setDescription(cooldownMessage);

                                return ctx.sendMessage({ embeds: [cooldownEmbed] });
                            });
                    } else {
                        return Users.updateOne(
                            {userId: user.userId},
                            {
                                $set: {
                                    "balance.coin": newBalance,
                                    "profile.xp": newExp,
                                    "peachy.streak": newStreak
                                }
                            }
                        ).then(() => {
                            client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

                            let bonusMessage = '';
                            if (bonusCoins > 0 || bonusExp > 0) {
                                bonusMessage = `\n**+40% Bonus**\n${emoji.coin}: **+${client.utils.formatNumber(bonusCoins)}** coins\n${emoji.exp} **+${client.utils.formatNumber(bonusExp)}** xp`;
                            }

                            const successEmbed = client.embed()
                                .setColor(color.main)
                                .setDescription(
                                    generalMessages.title
                                        .replace('%{mainLeft}', emoji.mainLeft)
                                        .replace('%{title}', "𝐏𝐄𝐀𝐂𝐇")
                                        .replace('%{mainRight}', emoji.mainRight) +
                                    peachyMessages.success
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

                            return ctx.sendMessage({embeds: [successEmbed]});
                        });
                    }
                });
        })
            .catch(error => {
                console.error('Error processing Peachy command:', error);
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
            });
    }
};
