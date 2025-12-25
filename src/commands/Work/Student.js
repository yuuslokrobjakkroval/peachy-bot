const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const chance = require('chance').Chance();
const moment = require('moment');

module.exports = class Student extends Command {
    constructor(client) {
        super(client, {
            name: 'student',
            description: {
                content: 'Claim your daily student reward.',
                examples: ['student'],
                usage: 'student',
            },
            category: 'work',
            aliases: ['study'],
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

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const studentMessages = language.locales.get(language.defaultLocale)?.workMessages?.studentMessages;

        try {
            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Check if user has student job
            if (!user.job || user.job.position !== 'student' || !user.job.approved) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const cooldownTime = 86400000; // 24 hours
            const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

            if (!isCooldownExpired) {
                const lastCooldownTimestamp = await client.utils.getCooldown(ctx.author.id, this.name.toLowerCase());
                const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                const duration = moment.duration(remainingTime, 'seconds');
                const hours = Math.floor(duration.asHours());
                const minutes = Math.floor(duration.asMinutes()) % 60;
                const seconds = Math.floor(duration.asSeconds()) % 60;

                const cooldownMessage = studentMessages.cooldown
                    .replace('%{hours}', hours)
                    .replace('%{minutes}', minutes)
                    .replace('%{seconds}', seconds);

                const cooldownEmbed = client.embed().setColor(color.danger).setDescription(cooldownMessage);
                return ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            const baseCoins = chance.integer({ min: 15000, max: 25000 });
            const baseExp = chance.integer({ min: 50, max: 100 });

            let bonusCoins = 0;
            let bonusExp = 0;

            const verify = user.verification.verify.status === 'verified';
            if (verify) {
                bonusCoins = Math.floor(baseCoins * 0.3);
                bonusExp = Math.floor(baseExp * 0.3);
            }

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;

            await Users.updateOne(
                { userId: user.userId },
                {
                    $inc: {
                        'balance.coin': totalCoins,
                        'profile.xp': totalExp,
                    },
                }
            );

            await client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

            const successEmbed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'STUDENT REWARD')
                        .replace('%{mainRight}', emoji.mainRight) +
                        studentMessages.success
                            .replace('%{coinEmote}', emoji.coin)
                            .replace('%{coin}', client.utils.formatNumber(totalCoins))
                            .replace('%{expEmote}', emoji.exp)
                            .replace('%{exp}', client.utils.formatNumber(totalExp))
                )
                .setFooter({
                    text:
                        generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                        `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error processing student command:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
