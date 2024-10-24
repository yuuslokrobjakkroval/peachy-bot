const { Command } = require('../../structures/index.js');
const { checkCooldown, updateCooldown, getCooldown } = require('../../functions/function');
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
        const gomaMessages = language.locales.get(language.defaultLocale)?.economyMessages?.gomaMessages;

        client.utils.getUser(ctx.author.id).then(user => {
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, gomaMessages.errors.noUser, color);
            }

            const verify = user.verification.verify.status === 'verified';
            const baseCoins = chance.integer({ min: 1000, max: 5000 });
            const newBalance = user.balance.coin + baseCoins;
            const newStreak = user.goma.streak + 1;

            const cooldownTime = 300000; // 5 minutes cooldown
            const isCooldownExpired = checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);
                if (!isCooldownExpired) {
                    getCooldown(ctx.author.id, this.name.toLowerCase()).then(lastCooldownTimestamp => {
                        const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                        const duration = moment.duration(remainingTime, 'seconds');
                        const minutes = Math.floor(duration.asMinutes());
                        const seconds = Math.floor(duration.asSeconds()) % 60;

                        const cooldownMessage = gomaMessages.cooldown
                            .replace('%{minutes}', minutes)
                            .replace('%{seconds}', seconds);

                        const cooldownEmbed = client.embed()
                            .setColor(color.red)
                            .setDescription(cooldownMessage);

                        return ctx.sendMessage({ embeds: [cooldownEmbed] });
                    }).catch(error => {
                        console.error('Error getting cooldown:', error);
                        return client.utils.sendErrorMessage(client, ctx, gomaMessages.errors.fetchFail, color);
                    });
                } else {
                    user.balance.coin = newBalance;
                    user.goma.streak = newStreak;

                    user.save().then(() => {
                        updateCooldown(client, ctx.author.id, this.name.toLowerCase(), cooldownTime);
                            const successEmbed = client.embed()
                                .setColor(color.main)
                                .setTitle(`${ctx.author.displayName} ${gomaMessages.success.title}`)
                                .setDescription(
                                    gomaMessages.success.description
                                        .replace('%{coinEmote}', emoji.coin)
                                        .replace('%{coin}', client.utils.formatNumber(baseCoins))
                                )
                                .setFooter({
                                    text: `Request By ${ctx.author.displayName}`,
                                    iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
                                });
                        return ctx.sendMessage({ embeds: [successEmbed] });
                    }).catch(error => {
                        console.error('Error updating cooldown:', error);
                        return client.utils.sendErrorMessage(client, ctx, peachyMessages.errors.fetchFail, color);
                }).catch(error => {
                    console.error('Error fetching user:', error);
                    return client.utils.sendErrorMessage(client, ctx, peachyMessages.errors.fetchFail, color);
                });
            }
        })
    }
};
