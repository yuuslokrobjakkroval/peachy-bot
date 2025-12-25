const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const chance = require('chance').Chance();
const moment = require('moment');

module.exports = class Work extends Command {
    constructor(client) {
        super(client, {
            name: 'work',
            description: {
                content: 'Perform work tasks to earn coins and XP.',
                examples: ['work shift', 'work earn', 'work salary'],
                usage: 'work <shift|earn|salary|bonus>',
            },
            category: 'work',
            aliases: ['job', 'task'],
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
                    description: 'Work action to perform.',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const workMessages = language.locales.get(language.defaultLocale)?.workMessages;

        const action = ctx.isInteraction ? ctx.interaction.options.getString('action').toLowerCase() : args[0].toLowerCase();

        const user = await Users.findOne({ userId: ctx.author.id });
        if (!user) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }

        switch (action) {
            case 'shift':
                return await this.handleShift(client, ctx, user, color, emoji, language);
            case 'earn':
                return await this.handleEarn(client, ctx, user, color, emoji, language);
            case 'salary':
                return await this.handleSalary(client, ctx, user, color, emoji, language);
            case 'bonus':
                return await this.handleBonus(client, ctx, user, color, emoji, language);
            default:
                return client.utils.sendErrorMessage(client, ctx, 'Invalid action. Use: shift, earn, salary, or bonus', color);
        }
    }

    async handleShift(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const isOnShift = user.work?.onShift || false;

        if (isOnShift) {
            // Clock out
            const shiftStart = new Date(user.work.shiftStart);
            const shiftDuration = Date.now() - shiftStart.getTime();
            const hours = Math.floor(shiftDuration / 3600000);
            const baseCoins = hours * 5000;
            const baseXP = hours * 10;

            const verify = user.verification.verify.status === 'verified';
            const bonusCoins = verify ? Math.floor(baseCoins * 0.3) : 0;
            const bonusXP = verify ? Math.floor(baseXP * 0.3) : 0;

            const totalCoins = baseCoins + bonusCoins;
            const totalXP = baseXP + bonusXP;

            await Users.updateOne(
                { userId: user.userId },
                {
                    $inc: {
                        'balance.coin': totalCoins,
                        'profile.xp': totalXP,
                    },
                    $set: { 'work.onShift': false },
                }
            );

            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'SHIFT ENDED')
                        .replace('%{mainRight}', emoji.mainRight) +
                        `You worked **${hours}** hours!\n${emoji.coin} Earned: **${client.utils.formatNumber(totalCoins)}**\n${emoji.exp} XP: **${client.utils.formatNumber(totalXP)}**`
                )
                .setFooter({
                    text: `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [embed] });
        } else {
            // Clock in
            await Users.updateOne(
                { userId: user.userId },
                {
                    $set: {
                        'work.onShift': true,
                        'work.shiftStart': new Date(),
                    },
                }
            );

            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'SHIFT STARTED')
                        .replace('%{mainRight}', emoji.mainRight) + 'You clocked in! Use `work shift` again to clock out.'
                )
                .setFooter({
                    text: `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [embed] });
        }
    }

    async handleEarn(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const cooldownTime = 300000; // 5 minutes
        const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, 'work_earn', cooldownTime);

        if (!isCooldownExpired) {
            const lastCooldownTimestamp = await client.utils.getCooldown(ctx.author.id, 'work_earn');
            const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
            const duration = moment.duration(remainingTime, 'seconds');
            const minutes = Math.floor(duration.asMinutes());
            const seconds = Math.floor(duration.asSeconds()) % 60;

            const embed = client
                .embed()
                .setColor(color.danger)
                .setDescription(`You need to wait **${minutes}** minutes and **${seconds}** seconds before working again!`);
            return ctx.sendMessage({ embeds: [embed] });
        }

        // Random jobs
        const jobs = [
            { name: '🧹 Cleaning', minCoins: 4000, maxCoins: 8000, minXP: 15, maxXP: 30 },
            { name: '🔧 Repair', minCoins: 6000, maxCoins: 12000, minXP: 25, maxXP: 45 },
            { name: '📦 Delivery', minCoins: 5000, maxCoins: 9000, minXP: 20, maxXP: 35 },
            { name: '🏗️ Construction', minCoins: 7000, maxCoins: 13000, minXP: 30, maxXP: 50 },
            { name: '💻 IT Support', minCoins: 8000, maxCoins: 15000, minXP: 35, maxXP: 55 },
            { name: '🍕 Delivery Driver', minCoins: 5500, maxCoins: 10000, minXP: 22, maxXP: 38 },
            { name: '🏥 Nursing', minCoins: 9000, maxCoins: 16000, minXP: 40, maxXP: 60 },
            { name: '📚 Tutoring', minCoins: 7500, maxCoins: 14000, minXP: 32, maxXP: 52 },
            { name: '🚗 Mechanic', minCoins: 8500, maxCoins: 15500, minXP: 38, maxXP: 58 },
            { name: '🛒 Cashier', minCoins: 4500, maxCoins: 8500, minXP: 18, maxXP: 32 },
        ];

        const selectedJob = jobs[Math.floor(Math.random() * jobs.length)];
        const baseCoins = chance.integer({ min: selectedJob.minCoins, max: selectedJob.maxCoins });
        const baseXP = chance.integer({ min: selectedJob.minXP, max: selectedJob.maxXP });

        const verify = user.verification.verify.status === 'verified';
        const bonusCoins = verify ? Math.floor(baseCoins * 0.3) : 0;
        const bonusXP = verify ? Math.floor(baseXP * 0.3) : 0;

        const totalCoins = baseCoins + bonusCoins;
        const totalXP = baseXP + bonusXP;

        // Random success chance (85% success rate)
        const successChance = chance.integer({ min: 1, max: 100 });
        const isSuccess = successChance <= 85;

        let embed;

        if (isSuccess) {
            await Users.updateOne(
                { userId: user.userId },
                {
                    $inc: {
                        'balance.coin': totalCoins,
                        'profile.xp': totalXP,
                    },
                }
            );

            const bonusMessage =
                bonusCoins > 0
                    ? `\n**+30% Verified Bonus**\n${emoji.coin}: **+${client.utils.formatNumber(bonusCoins)}**\n${emoji.exp}: **+${client.utils.formatNumber(bonusXP)}**`
                    : '';

            embed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'WORK COMPLETED')
                        .replace('%{mainRight}', emoji.mainRight) +
                        `**Task:** ${selectedJob.name}\n${emoji.coin} **+${client.utils.formatNumber(baseCoins)}** coins\n${emoji.exp} **+${client.utils.formatNumber(baseXP)}** XP${bonusMessage}`
                )
                .setFooter({
                    text: `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });
        } else {
            // Failed task - lose some coins
            const penaltyCoins = chance.integer({ min: 500, max: 1500 });
            const currentBalance = user.balance.coin;

            if (currentBalance >= penaltyCoins) {
                await Users.updateOne({ userId: user.userId }, { $inc: { 'balance.coin': -penaltyCoins } });
            }

            embed = client
                .embed()
                .setColor(color.danger)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'WORK FAILED')
                        .replace('%{mainRight}', emoji.mainRight) +
                        `**Task:** ${selectedJob.name}\n❌ You failed the task!\n💔 Lost: **${client.utils.formatNumber(Math.min(penaltyCoins, currentBalance))}** coins`
                )
                .setFooter({
                    text: `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });
        }

        await client.utils.updateCooldown(ctx.author.id, 'work_earn', cooldownTime);

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleSalary(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        if (!user.job || !user.job.position || !user.job.approved) {
            return client.utils.sendErrorMessage(client, ctx, 'You must have an active job to claim salary!', color);
        }

        const cooldownTime = 2592000000; // 30 days
        const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, 'work_salary', cooldownTime);

        if (!isCooldownExpired) {
            return client.utils.sendErrorMessage(client, ctx, 'You already claimed your salary this month!', color);
        }

        const jobSalaries = {
            student: { coin: 50000, xp: 200 },
            police: { coin: 80000, xp: 300 },
        };

        const salary = jobSalaries[user.job.position] || { coin: 30000, xp: 100 };

        await Users.updateOne(
            { userId: user.userId },
            {
                $inc: {
                    'balance.coin': salary.coin,
                    'profile.xp': salary.xp,
                },
            }
        );

        await client.utils.updateCooldown(ctx.author.id, 'work_salary', cooldownTime);

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'MONTHLY SALARY')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `Position: **${user.job.position.toUpperCase()}**\n${emoji.coin} **+${client.utils.formatNumber(salary.coin)}** coins\n${emoji.exp} **+${client.utils.formatNumber(salary.xp)}** XP`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }

    async handleBonus(client, ctx, user, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        const cooldownTime = 604800000; // 7 days
        const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, 'work_bonus', cooldownTime);

        if (!isCooldownExpired) {
            return client.utils.sendErrorMessage(client, ctx, 'You already claimed your bonus this week!', color);
        }

        const bonusCoins = chance.integer({ min: 20000, max: 50000 });
        const bonusXP = chance.integer({ min: 100, max: 200 });

        await Users.updateOne(
            { userId: user.userId },
            {
                $inc: {
                    'balance.coin': bonusCoins,
                    'profile.xp': bonusXP,
                },
            }
        );

        await client.utils.updateCooldown(ctx.author.id, 'work_bonus', cooldownTime);

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'PERFORMANCE BONUS')
                    .replace('%{mainRight}', emoji.mainRight) +
                    `${emoji.coin} **+${client.utils.formatNumber(bonusCoins)}** coins\n${emoji.exp} **+${client.utils.formatNumber(bonusXP)}** XP`
            )
            .setFooter({
                text: `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [embed] });
    }
};
