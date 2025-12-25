const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const chance = require('chance').Chance();
const moment = require('moment');
const globalGif = require('../../utils/Gif');

module.exports = class Police extends Command {
    constructor(client) {
        super(client, {
            name: 'police',
            description: {
                content: 'As a police officer, catch thieves who rob others.',
                examples: ['police @user'],
                usage: 'police <user>',
            },
            category: 'work',
            aliases: ['catch', 'arrest'],
            cooldown: 10,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'target',
                    description: 'The user to catch.',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const policeMessages = language.locales.get(language.defaultLocale)?.workMessages?.policeMessages;

        try {
            // Get target user
            const targetUser = ctx.isInteraction
                ? ctx.interaction.options.getUser('target') || ctx.author
                : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

            // Prevent catching self
            if (ctx.author.id === targetUser.id) {
                return await client.utils.sendErrorMessage(client, ctx, policeMessages.invalidTarget, color);
            }

            // Fetch user data
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Check if user has police job
            if (!user.job || user.job.position !== 'police' || !user.job.approved) {
                return await client.utils.sendErrorMessage(client, ctx, policeMessages.notPolice, color);
            }

            // Fetch target user's data
            const target = await Users.findOne({ userId: targetUser.id });
            if (!target) {
                return await client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Determine success rate (70% success for police)
            const successChance = chance.integer({ min: 1, max: 100 });
            const isSuccess = successChance <= 70;

            const stolenAmount = chance.integer({ min: 1000, max: 5000 });
            const policeReward = Math.floor(stolenAmount * 0.5);
            const penaltyAmount = chance.integer({ min: 500, max: 1500 });

            let resultEmbed;

            if (isSuccess) {
                // Successfully caught a robber
                user.balance.coin += policeReward;

                await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();

                resultEmbed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        generalMessages.title
                            .replace('%{mainLeft}', emoji.mainLeft)
                            .replace('%{title}', 'POLICE')
                            .replace('%{mainRight}', emoji.mainRight) +
                            policeMessages.success
                                .replace('%{thief}', targetUser.displayName)
                                .replace('%{stolenAmount}', client.utils.formatNumber(stolenAmount))
                                .replace('%{policeReward}', client.utils.formatNumber(policeReward))
                                .replace('%{emoji}', emoji.coin)
                    )
                    .setImage(globalGif.banner.transferPending)
                    .setFooter({
                        text:
                            generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                            `Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });
            } else {
                // Failed to catch - lose coins as penalty
                if (user.balance.coin < penaltyAmount) {
                    user.balance.coin = 0;
                } else {
                    user.balance.coin -= penaltyAmount;
                }

                await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();

                resultEmbed = client
                    .embed()
                    .setColor(color.danger)
                    .setDescription(
                        generalMessages.title
                            .replace('%{mainLeft}', emoji.mainLeft)
                            .replace('%{title}', 'POLICE')
                            .replace('%{mainRight}', emoji.mainRight) +
                            policeMessages.failed
                                .replace('%{thief}', targetUser.displayName)
                                .replace('%{penalty}', client.utils.formatNumber(penaltyAmount))
                                .replace('%{emoji}', emoji.coin)
                    )
                    .setImage(globalGif.banner.transferPending)
                    .setFooter({
                        text:
                            generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                            `Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });
            }

            await ctx.sendMessage({ embeds: [resultEmbed] });
        } catch (error) {
            console.error('Error processing police command:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
