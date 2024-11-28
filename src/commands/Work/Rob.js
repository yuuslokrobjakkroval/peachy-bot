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
            : ctx.message.mentions.users.first() || client.users.cache.get(args[0]);

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
        if (robber.work.position.toLowerCase() === 'police') {
            return client.utils.sendErrorMessage(client, ctx, robMessages.cannotRobAsPolice, color);
        }

        // Prevent robbing users with the position of 'police'
        if (victim.work.position.toLowerCase() === 'police') {
            return client.utils.sendErrorMessage(client, ctx, robMessages.protectedByPolice.replace('%{victim}', target.displayName), color);
        }

        // Check cooldown
        const cooldownTime = 10 * 60 * 1000;
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
                    return client.utils.sendErrorMessage(client, ctx, robMessages.notEnoughCoins, color);
                }

                // Calculate the robbery success and the amount to steal
                const success = chance.bool({ likelihood: 75 }); // 75% chance to succeed
                const stolenAmount = Math.floor(victim.balance.coin * (chance.integer({ min: 2, max: 3 }) / 100));

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
