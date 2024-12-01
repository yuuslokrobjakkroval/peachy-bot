const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const chance = require('chance').Chance();

module.exports = class CatchThief extends Command {
    constructor(client) {
        super(client, {
            name: 'police',
            description: {
                content: 'Police can catch thieves who have successfully robbed someone.',
                examples: ['police @username'],
                usage: 'police <user>',
            },
            category: 'work',
            aliases: ['catch', "catchthief"],
            cooldown: 10, // 10 seconds cooldown for police
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
                    description: 'The thief you want to catch.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const policeMessages = language.locales.get(language.defaultLocale)?.workMessages?.policeMessages;

        // Get target user (the one to be caught by the police)
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('target')
            : ctx.message.mentions.users.first();

        if (!target || target.id === ctx.author.id) {
            return client.utils.sendErrorMessage(client, ctx, policeMessages.invalidTarget, color);
        }

        // Fetch both the police and the suspected thief from the database
        const [police, thief] = await Promise.all([
            Users.findOne({ userId: ctx.author.id }),
            Users.findOne({ userId: target.id }),
        ]);

        if (!police || !thief) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }

        // Check if the user has the position of "police"
        if (police.work.position.toLowerCase() !== 'police' && police.work.status !== 'approved' ) {
            return client.utils.sendErrorMessage(client, ctx, policeMessages.notPolice, color);
        }

        // Check if the target is a thief (robbed someone successfully)
        if (!thief.work.rob || !thief.work.robAmount) {
            return client.utils.sendErrorMessage(client, ctx, policeMessages.noRobberyToCatch, color);
        }

        // If police successfully catches the thief
        const success = chance.bool({ likelihood: 80 }); // 80% chance to succeed in catching the thief

        if (success) {
            // Police successfully catches the thief and uses the stolen amount from robAmount
            const stolenAmount = thief.work.robAmount;
            const policeReward = Math.floor(stolenAmount * 1.2);

            // Update balances
            thief.balance.coin -= stolenAmount; // Thief loses the stolen amount
            police.balance.coin += policeReward; // Police receives their reward

            thief.work.rob = false; // Reset the robbery status for the thief
            thief.work.robAmount = 0; // Reset the robbed amount after being caught

            // Save updates to the database
            await Promise.all([police.save(), thief.save()]);

            // Send success message
            const successEmbed = client.embed()
                .setColor(color.main)
                .setDescription(
                    policeMessages.success
                        .replace('%{policeReward}', client.utils.formatNumber(policeReward))
                        .replace('%{thief}', target.displayName)
                        .replace('%{stolenAmount}', client.utils.formatNumber(stolenAmount))
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [successEmbed] });
        } else {
            // Police failed to catch the thief - apply penalty to police
            const penalty = Math.floor(police.balance.coin * 0.01); // 1% penalty for failure
            police.balance.coin = Math.max(0, police.balance.coin - penalty);
            await police.save();

            // Send failure message
            const failureEmbed = client.embed()
                .setColor(color.danger)
                .setDescription(
                    policeMessages.failed
                        .replace('%{penalty}', client.utils.formatNumber(penalty))
                        .replace('%{thief}', target.displayName)
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [failureEmbed] });
        }
    }
};
