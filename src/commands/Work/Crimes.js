const { Command } = require('../../structures');
const Users = require('../../schemas/user');

module.exports = class Crimes extends Command {
    constructor(client) {
        super(client, {
            name: 'crimes',
            description: {
                content: 'View crime stats, place bounties, or report crimes.',
                examples: ['crimes list', 'crimes bounty @user 10000', 'crimes stats'],
                usage: 'crimes <list|bounty|report|stats>',
            },
            category: 'work',
            aliases: ['crime', 'criminal'],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'action',
                    description: 'Crime action.',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const action = ctx.isInteraction ? ctx.interaction.options.getString('action').toLowerCase() : args[0].toLowerCase();

        const user = await Users.findOne({ userId: ctx.author.id });
        if (!user) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }

        switch (action) {
            case 'list':
                return await this.handleList(client, ctx, user, color, emoji, language);
            case 'bounty':
                return await this.handleBounty(client, ctx, user, args, color, emoji, language);
            case 'report':
                return await this.handleReport(client, ctx, user, color, emoji, language);
            case 'stats':
                return await this.handleStats(client, ctx, user, color, emoji, language);
            default:
                return client.utils.sendErrorMessage(client, ctx, 'Invalid action. Use: list, bounty, report, or stats', color);
        }
    }

    async handleList(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        // Fetch recent robberies from users with robbery records
        const recentCrimes = await Users.find({
            'crimes.robberies': { $gt: 0 },
        })
            .sort({ 'crimes.lastRobberyTime': -1 })
            .limit(10);

        if (recentCrimes.length === 0) {
            return client.utils.sendErrorMessage(client, ctx, 'No recent crimes recorded!', color);
        }

        let crimeList = recentCrimes.map((c, i) => `**${i + 1}.** <@${c.userId}> - Robberies: ${c.crimes?.robberies || 0}`).join('\n');

        const embed = client
            .embed()
            .setColor(color.main)
            .setTitle('Recent Crimes')
            .setDescription(crimeList)
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleBounty(client, ctx, user, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const targetUser = ctx.message?.mentions.members.first();
        const bountyAmount = parseInt(args[2]);

        if (!targetUser || !bountyAmount || bountyAmount < 5000) {
            return client.utils.sendErrorMessage(client, ctx, 'Usage: crimes bounty @user <amount>\nMinimum bounty: 5000 coins', color);
        }

        if (user.balance.coin < bountyAmount) {
            return client.utils.sendErrorMessage(client, ctx, 'You do not have enough coins to place a bounty!', color);
        }

        const target = await Users.findOne({ userId: targetUser.id });
        if (!target) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }

        // Deduct bounty from user
        await Users.updateOne({ userId: user.userId }, { $inc: { 'balance.coin': -bountyAmount } });

        // Add bounty to target
        await Users.updateOne(
            { userId: targetUser.id },
            {
                $inc: { 'bounty.amount': bountyAmount },
                $set: { 'bounty.placedBy': ctx.author.id, 'bounty.placedDate': new Date() },
            }
        );

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'BOUNTY PLACED')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `**Target:** ${targetUser.displayName}\n**Bounty Amount:** ${client.utils.formatNumber(bountyAmount)} ${emoji.coin}`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleReport(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'CRIME REPORTED')
                    .replace('%{mainRight}', emoji.mainRight) +
                    'Your report has been submitted to the authorities.\nThe police will investigate shortly.'
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleStats(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const robberies = user.crimes?.robberies || 0;
        const arrests = user.crimes?.arrests || 0;
        const bountyAmount = user.bounty?.amount || 0;

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'CRIME STATS')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `**Robberies:** ${robberies}\n**Arrests:** ${arrests}\n**Active Bounty:** ${client.utils.formatNumber(bountyAmount)} ${emoji.coin}`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }
};
