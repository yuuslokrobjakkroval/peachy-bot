const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const chance = require('chance').Chance();
const moment = require('moment');

module.exports = class StudentClaim extends Command {
    constructor(client) {
        super(client, {
            name: 'student',
            description: {
                content: 'Claim your student rewards. Can be claimed every 4 hours.',
                examples: ['student'],
                usage: 'student',
            },
            category: 'work',
            aliases: ['sclaim', 'studentclaim'],
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
        const studentMessages = language.locales.get(language.defaultLocale)?.workMessages?.studentMessages;

        // Get user using client.utils
        client.utils.getUser(ctx.author.id).then(user => {
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const baseCoins = chance.integer({ min: 800, max: 1000 });
            const baseExp = chance.integer({ min: 15, max: 20 });

            const totalCoins = baseCoins;
            const totalExp = baseExp;
            const newBalance = user.balance.coin + totalCoins;
            const newExp = user.profile.xp + totalExp;

            const cooldownTime = 4 * 60 * 60 * 1000;
            return client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime)
                .then(isCooldownExpired => {
                    if (!isCooldownExpired) {
                        return client.utils.getCooldown(ctx.author.id, this.name.toLowerCase())
                            .then(lastCooldownTimestamp => {
                                const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                                const duration = moment.duration(remainingTime, 'seconds');
                                const hours = Math.floor(duration.asHours());
                                const minutes = Math.floor(duration.asMinutes() % 60);
                                const seconds = Math.floor(duration.asSeconds() % 60);

                                const cooldownMessage = studentMessages.cooldown
                                    .replace('%{hours}', hours)
                                    .replace('%{minutes}', minutes)
                                    .replace('%{seconds}', seconds);

                                const cooldownEmbed = client.embed()
                                    .setColor(color.danger)
                                    .setDescription(cooldownMessage);

                                return ctx.sendMessage({ embeds: [cooldownEmbed] });
                            });
                    } else {
                        return Users.updateOne(
                            { userId: user.userId },
                            {
                                $set: {
                                    "balance.coin": newBalance,
                                    "profile.xp": newExp,
                                },
                            }
                        ).then(() => {
                            client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

                            const successEmbed = client.embed()
                                .setColor(color.main)
                                .setDescription(
                                    generalMessages.title
                                        .replace('%{mainLeft}', emoji.mainLeft)
                                        .replace('%{title}', "𝐒𝐓𝐔𝐃𝐄𝐍𝐓 𝐂𝐋𝐀𝐈𝐌")
                                        .replace('%{mainRight}', emoji.mainRight) +
                                    studentMessages.success
                                        .replace('%{coinEmote}', emoji.coin)
                                        .replace('%{coin}', client.utils.formatNumber(baseCoins))
                                        .replace('%{expEmote}', emoji.exp)
                                        .replace('%{exp}', client.utils.formatNumber(baseExp))
                                )
                                .setFooter({
                                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                                    iconURL: ctx.author.displayAvatarURL(),
                                });

                            return ctx.sendMessage({ embeds: [successEmbed] });
                        });
                    }
                });
        })
            .catch(error => {
                console.error('Error processing Student Claim command:', error);
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
            });
    }
};
