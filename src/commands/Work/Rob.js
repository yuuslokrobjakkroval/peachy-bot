const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const moment = require("moment/moment");
const chance = require('chance').Chance();

module.exports = class Rob extends Command {
    constructor(client) {
        super(client, {
            name: 'rob',
            description: {
                content: 'Attempt to rob another user for their coins.',
                examples: ['rob @username', 'rob 123456789012345678'],
                usage: 'rob <user>',
            },
            category: 'work',
            aliases: ['steal'],
            cooldown: 8,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'target',
                    description: 'The user you want to rob.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const robMessages = language.locales.get(language.defaultLocale)?.workMessages?.robMessages;

        // Get target user
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('target')
            : ctx.message.mentions.users.first();

        if (!target || target.id === ctx.author.id) {
            return client.utils.sendErrorMessage(client, ctx, robMessages.invalidTarget, color);
        }

        // Fetch both users from the database
        const [robber, victim] = await Promise.all([
            Users.findOne({ userId: ctx.author.id }),
            Users.findOne({ userId: target.id }),
        ]);

        if (!robber || !victim) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }

        // Prevent robbing if the robber's position is 'police'
        if (robber.work.status === 'approved' && robber.work.position.toLowerCase() === 'police') {
            return client.utils.sendErrorMessage(client, ctx, robMessages.cannotRobAsPolice, color);
        }

        // Prevent robbing users with the position of 'police'
        if (victim.work.status === 'approved' && victim.work.position.toLowerCase() === 'police') {
            return client.utils.sendErrorMessage(client, ctx, robMessages.protectedByPolice.replace('%{victim}', target.displayName), color);
        }

        // Check cooldown
        const cooldownTime = 5 * 60 * 1000;
        client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime).then(async isCooldownExpired => {
            if (!isCooldownExpired) {
                client.utils.getCooldown(ctx.author.id, this.name.toLowerCase()).then(lastCooldownTimestamp => {
                    const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                    const duration = moment.duration(remainingTime, 'seconds');
                    const minutes = Math.floor(duration.asMinutes());
                    const seconds = Math.floor(duration.asSeconds()) % 60;

                    const cooldownMessage = robMessages.cooldown.replace('%{minutes}', minutes).replace('%{seconds}', seconds);
                    const cooldownEmbed = client.embed().setColor(color.danger).setDescription(cooldownMessage);

                    return ctx.sendMessage({embeds: [cooldownEmbed]});
                });
            } else {
                // Check if victim has enough coins
                if (victim.balance.coin < 100) {
                    return client.utils.sendErrorMessage(client, ctx, robMessages.notEnoughCoins.replace('%{victim}', target.displayName), color);
                }

                // Calculate the robbery success and the amount to steal
                const victimCoins = victim.balance.coin;
                let successRate;

                // Set success rate based on the coin balance
                if (victimCoins >= 500000000) {
                    successRate = 10;  // 500M+ coins
                } else if (victimCoins >= 300000000) {
                    successRate = 20;  // 300M coins
                } else if (victimCoins >= 200000000) {
                    successRate = 30;  // 200M coins
                } else if (victimCoins >= 100000000) {
                    successRate = 40;  // 100M coins
                } else if (victimCoins >= 50000000) {
                    successRate = 50;  // 50M coins
                } else if (victimCoins >= 20000000) {
                    successRate = 60;  // 20M coins
                } else if (victimCoins >= 10000000) {
                    successRate = 65;  // 10M coins
                } else if (victimCoins >= 5000000) {
                    successRate = 70;  // 5M coins
                } else if (victimCoins >= 1000000) {
                    successRate = 75;  // 1M coins
                } else {
                    successRate = 80;  // Below 1M coins
                }
                const success = chance.bool({ likelihood: successRate }); // 75% chance to succeed
                const stolenAmount = Math.floor(victim.balance.coin * (chance.integer({ min: 1, max: 1.5 }) / 100));

                if (success) {
                    robber.balance.coin += stolenAmount;
                    robber.work.rob = true;  // Mark the robber as successful
                    robber.work.robAmount = stolenAmount;  // Save the robbed amount

                    victim.balance.coin -= stolenAmount;  // Victim loses coins
                    await Promise.all([robber.save(), victim.save()]);
                    client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

                    // Send success message
                    const successEmbed = client.embed()
                        .setColor(color.main)
                        .setDescription(
                            robMessages.success
                                .replace('%{stolenAmount}', client.utils.formatNumber(stolenAmount))
                                .replace('%{victim}', target.displayName)
                        )
                        .setFooter({
                            text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    return ctx.sendMessage({ embeds: [successEmbed] });
                } else {
                    // Failed robbery - Apply penalty
                    const penalty = Math.floor(robber.balance.coin * 0.01); // 1% of robber's balance
                    robber.balance.coin = Math.max(0, robber.balance.coin - penalty);
                    await robber.save();

                    const failureEmbed = client.embed()
                        .setColor(color.danger)
                        .setDescription(
                            robMessages.failed
                                .replace('%{penalty}', client.utils.formatNumber(penalty))
                                .replace('%{victim}', target.displayName)
                        )
                        .setFooter({
                            text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    return ctx.sendMessage({ embeds: [failureEmbed] });
                }
            }
        }).catch(error => {
            console.error('Error checking cooldown:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        });

    }
};
