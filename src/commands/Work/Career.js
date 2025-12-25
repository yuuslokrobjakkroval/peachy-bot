const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const chance = require('chance').Chance();

module.exports = class Career extends Command {
    constructor(client) {
        super(client, {
            name: 'career',
            description: {
                content: 'Manage your career - promote, train, transfer, or view stats.',
                examples: ['career promote', 'career training', 'career transfer student', 'career stats'],
                usage: 'career <promote|training|transfer|stats>',
            },
            category: 'work',
            aliases: ['job', 'promote'],
            cooldown: 5,
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
                    description: 'Career action.',
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
            case 'promote':
                return await this.handlePromote(client, ctx, user, color, emoji, language);
            case 'training':
                return await this.handleTraining(client, ctx, user, color, emoji, language);
            case 'transfer':
                return await this.handleTransfer(client, ctx, user, args, color, emoji, language);
            case 'stats':
                return await this.handleStats(client, ctx, user, color, emoji, language);
            default:
                return client.utils.sendErrorMessage(client, ctx, 'Invalid action. Use: promote, training, transfer, or stats', color);
        }
    }

    async handlePromote(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        if (!user.job || !user.job.position || !user.job.approved) {
            return client.utils.sendErrorMessage(client, ctx, 'You must have an active job to get promoted!', color);
        }

        const currentLevel = user.job.level || 1;
        if (currentLevel >= 5) {
            return client.utils.sendErrorMessage(client, ctx, 'You are already at the maximum level!', color);
        }

        const requiredXP = 10000 * currentLevel;
        if (user.profile.xp < requiredXP) {
            return client.utils.sendErrorMessage(
                client,
                ctx,
                `You need **${requiredXP - user.profile.xp}** more XP to get promoted!`,
                color
            );
        }

        const newLevel = currentLevel + 1;
        const promoBenefit = 10000 * newLevel;

        await Users.updateOne(
            { userId: user.userId },
            {
                $inc: { 'balance.coin': promoBenefit },
                $set: { 'job.level': newLevel },
            }
        );

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'PROMOTION')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `Congratulations! You were promoted to Level **${newLevel}**!\n${emoji.coin} Promotion Bonus: **${client.utils.formatNumber(promoBenefit)}**`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleTraining(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const cooldownTime = 86400000; // 24 hours
        const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, 'career_training', cooldownTime);

        if (!isCooldownExpired) {
            return client.utils.sendErrorMessage(client, ctx, 'You already trained today! Try again in 24 hours.', color);
        }

        const trainingXP = chance.integer({ min: 500, max: 1500 });
        const trainingSalaryBoost = chance.integer({ min: 2000, max: 5000 });

        await Users.updateOne(
            { userId: user.userId },
            {
                $inc: {
                    'profile.xp': trainingXP,
                    'work.totalSalaryBoost': trainingSalaryBoost,
                },
            }
        );

        await client.utils.updateCooldown(ctx.author.id, 'career_training', cooldownTime);

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'TRAINING COMPLETE')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `${emoji.exp} XP Gained: **${client.utils.formatNumber(trainingXP)}**\n💰 Salary Boost: **${client.utils.formatNumber(trainingSalaryBoost)}**`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleTransfer(client, ctx, user, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const newPosition = args[1]?.toLowerCase();
        const validPositions = ['student', 'police'];

        if (!newPosition || !validPositions.includes(newPosition)) {
            return client.utils.sendErrorMessage(client, ctx, 'Valid positions: student, police', color);
        }

        if (user.job?.position === newPosition) {
            return client.utils.sendErrorMessage(client, ctx, 'You already have this position!', color);
        }

        const transferBonus = chance.integer({ min: 5000, max: 15000 });

        await Users.updateOne(
            { userId: user.userId },
            {
                $set: {
                    'job.position': newPosition,
                    'job.approved': true,
                    'job.level': 1,
                    'job.appliedDate': new Date(),
                },
                $inc: { 'balance.coin': transferBonus },
            }
        );

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'TRANSFER COMPLETE')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `You transferred to **${newPosition.toUpperCase()}**!\n${emoji.coin} Transfer Bonus: **${client.utils.formatNumber(transferBonus)}**`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleStats(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const position = user.job?.position || 'None';
        const level = user.job?.level || 1;
        const approved = user.job?.approved ? 'Yes' : 'No';
        const totalSalaryBoost = user.work?.totalSalaryBoost || 0;

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'CAREER STATS')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `**Position:** ${position}\n**Level:** ${level}\n**Approved:** ${approved}\n**Salary Boost:** ${client.utils.formatNumber(totalSalaryBoost)}\n**Total XP:** ${client.utils.formatNumber(user.profile?.xp || 0)}`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }
};
