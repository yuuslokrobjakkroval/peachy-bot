const { Command } = require('../../structures/index.js');
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
            const verify = user.verification.verify.status === 'verified';
            const { coin } = user.balance;
            const { xp } = user.profile;
            const baseCoins = chance.integer({ min: 400, max: 500 });
            const baseExp = chance.integer({ min: 5, max: 10 });

            let bonusCoins = 0;
            let bonusExp = 0;

            if (verify) {
                bonusCoins = Math.floor(baseCoins * 0.20);
                bonusExp = Math.floor(baseExp * 0.20);
            }

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;
            const newBalance = coin + totalCoins;
            const newExp = xp + totalExp;
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
                    }

                    // Update user data
                    user.balance.coin = newBalance;
                    user.profile.xp = newExp;
                    user.peachy.streak = newStreak;

                    return Promise.all([
                        user.save(), // Save updated user data
                        client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime),
                    ]).then(() => {
                        // Display success embed
                        const successEmbed = client.embed()
                            .setColor(color.main)
                            .setTitle(`${ctx.author.displayName} ${peachyMessages.success.title}`)
                            .setDescription(
                                peachyMessages.success.description
                                    .replace('%{coinEmote}', emoji.coin)
                                    .replace('%{coin}', client.utils.formatNumber(baseCoins))
                            )
                            .setFooter({
                                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        return ctx.sendMessage({ embeds: [successEmbed] });
                    });
                });
        })
            .catch(error => {
                console.error('Error processing Peachy command:', error);
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
            });
    }
};
