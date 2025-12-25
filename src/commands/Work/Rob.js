const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const chance = require('chance').Chance();
const moment = require('moment');
const globalGif = require('../../utils/Gif');

module.exports = class Rob extends Command {
    constructor(client) {
        super(client, {
            name: 'rob',
            description: {
                content: 'Rob coins from another user.',
                examples: ['rob @user', 'rob @user'],
                usage: 'rob <user>',
            },
            category: 'work',
            aliases: ['steal', 'plon', 'louch'],
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
                    description: 'The user to rob.',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const robMessages = language.locales.get(language.defaultLocale)?.workMessages?.robMessages;

        try {
            // Get the target user
            const targetUser = ctx.isInteraction
                ? ctx.interaction.options.getUser('target') || ctx.author
                : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

            // Prevent robbing self
            if (ctx.author.id === targetUser.id) {
                return await client.utils.sendErrorMessage(client, ctx, robMessages.invalidTarget, color);
            }

            // Prevent robbing bots
            if (targetUser && targetUser.user.bot) {
                return await client.utils.sendErrorMessage(client, ctx, generalMessages.botTransfer, color);
            }

            // Fetch user data
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Check cooldown - 10 minutes (600000 ms)
            const cooldownTime = 600000;
            const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

            if (!isCooldownExpired) {
                const lastCooldownTimestamp = await client.utils.getCooldown(ctx.author.id, this.name.toLowerCase());
                const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                const duration = moment.duration(remainingTime, 'seconds');
                const minutes = Math.floor(duration.asMinutes());
                const seconds = Math.floor(duration.asSeconds()) % 60;

                const cooldownMessage = robMessages.cooldown.replace('%{minutes}', minutes).replace('%{seconds}', seconds);

                const cooldownEmbed = client.embed().setColor(color.danger).setDescription(cooldownMessage);
                return ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            // Fetch or create target user's data
            let target = await Users.findOne({ userId: targetUser.id });
            if (!target) {
                target = new Users({
                    userId: targetUser.id,
                    balance: { coin: 0, bank: 0 },
                });
                await target.save();
            }

            // Check if victim has enough coins
            if (target.balance.coin < 1000) {
                return await client.utils.sendErrorMessage(
                    client,
                    ctx,
                    robMessages.notEnoughCoins.replace('%{victim}', targetUser.displayName),
                    color
                );
            }

            // Determine success rate (60% success, 40% failure)
            const successChance = chance.integer({ min: 1, max: 100 });
            const isSuccess = successChance <= 60;

            const stolenAmount = chance.integer({
                min: Math.floor(target.balance.coin * 0.1),
                max: Math.floor(target.balance.coin * 0.3),
            });

            const penaltyAmount = chance.integer({ min: 500, max: 2000 });

            let resultEmbed;

            if (isSuccess) {
                // Successful robbery
                user.balance.coin += stolenAmount;
                target.balance.coin -= stolenAmount;

                await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();

                await Users.updateOne({ userId: targetUser.id }, { 'balance.coin': target.balance.coin }).exec();

                resultEmbed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        generalMessages.title
                            .replace('%{mainLeft}', emoji.mainLeft)
                            .replace('%{title}', 'ROB')
                            .replace('%{mainRight}', emoji.mainRight) +
                            robMessages.success
                                .replace('%{victim}', targetUser.displayName)
                                .replace('%{stolenAmount}', client.utils.formatNumber(stolenAmount))
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
                // Failed robbery - lose coins as penalty
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
                            .replace('%{title}', 'ROB')
                            .replace('%{mainRight}', emoji.mainRight) +
                            robMessages.failed
                                .replace('%{victim}', targetUser.displayName)
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

            // Update cooldown after robbery attempt
            await client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);
        } catch (error) {
            console.error('Error processing rob command:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
