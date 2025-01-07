const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const moment = require("moment-timezone");
const chance = require('chance').Chance();

module.exports = class Weekly extends Command {
    constructor(client) {
        super(client, {
            name: 'weekly',
            description: {
                content: '𝑬𝒂𝒓𝒏 𝒔𝒐𝒎𝒆 𝒄𝒐𝒊𝒏𝒔 𝒘𝒆𝒆𝒌𝒍𝒚.',
                examples: ['𝒘𝒆𝒆𝒌𝒍𝒚'],
                usage: '𝒘𝒆𝒆𝒌𝒍𝒚',
            },
            category: 'economy',
            aliases: ['week'],
            cooldown: 3,
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
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const weeklyMessages = language.locales.get(language.defaultLocale)?.economyMessages?.weeklyMessages;

        client.utils.getUser(ctx.author.id).then(user => {
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const baseCoins = chance.integer({ min: 500000, max: 1000000 });
            const baseExp = chance.integer({ min: 200, max: 250 });

            const verify = user.verification.verify.status === 'verified';

            let bonusCoins = 0;
            let bonusExp = 0;

            if (verify) {
                bonusCoins = Math.floor(baseCoins * 0.30);
                bonusExp = Math.floor(baseExp * 0.30);
            }

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;
            const newBalance = user.balance.coin + totalCoins;
            const newExp = user.profile.xp + totalExp;

            const now = moment().tz('Asia/Bangkok');
            const nextWeekly = moment(now).add(1, 'week').toDate();

            const timeUntilNextWeekly = nextWeekly - now.toDate();
            return client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly).then(isCooldownExpired => {
                if (!isCooldownExpired) {
                    return client.utils.getCooldown(ctx.author.id, this.name.toLowerCase()).then(lastCooldownTimestamp => {
                        const remainingTime = Math.ceil((lastCooldownTimestamp + timeUntilNextWeekly - Date.now()) / 1000);
                        const cooldownMessage = this.getCooldownMessage(remainingTime, client, language, weeklyMessages);

                        const cooldownEmbed = client
                            .embed()
                            .setColor(color.danger)
                            .setDescription(cooldownMessage);

                        return ctx.sendMessage({ embeds: [cooldownEmbed] });
                    });
                } else {

                    return Users.updateOne(
                        {userId: user.userId},
                        {
                            $set: {
                                "balance.coin": newBalance,
                                "profile.xp": newExp
                            }
                        }
                    ).then(() => {
                        return client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNextWeekly);
                    }).then(() => {
                        let bonusMessage = '';
                        if (bonusCoins > 0 || bonusExp > 0) {
                            bonusMessage = `\n**+30% Bonus**\n${emoji.coin}: **+${client.utils.formatNumber(bonusCoins)}** coins\n${emoji.exp} **+${client.utils.formatNumber(bonusExp)}** xp`;
                        }
                        const embed = this.createSuccessEmbed(client, ctx, emoji, totalCoins, totalExp, now, weeklyMessages, generalMessages, bonusMessage);
                        return ctx.sendMessage({embeds: [embed]});
                    });
                }
            });
        }).catch(error => {
            console.error('Error processing weekly command:', error);
            return client.utils.sendErrorMessage(client, ctx, weeklyMessages.error, color);
        });
    }

    getCooldownMessage(remainingTime, client, language, weeklyMessages) {
        const days = Math.floor(remainingTime / 86400);
        const hours = Math.floor((remainingTime % 86400) / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;

        const daysString = days > 1 ? `${days} days` : `${days} day`;
        const hoursString = hours > 1 ? `${hours} hrs` : `${hours} hr`;
        const minutesString = minutes > 1 ? `${minutes} mins` : `${minutes} min`;
        const secondsString = seconds > 1 ? `${seconds} secs` : `${seconds} sec`;

        if (days > 1) {
            return weeklyMessages.cooldown.multipleDays
                .replace('%{days}', daysString)
                .replace('%{hours}', hoursString)
                .replace('%{minutes}', minutesString)
                .replace('%{seconds}', secondsString);
        } else if (days === 1) {
            return weeklyMessages.cooldown.singleDay
                .replace('%{days}', daysString)
                .replace('%{hours}', hoursString)
                .replace('%{minutes}', minutesString)
                .replace('%{seconds}', secondsString);
        } else {
            return weeklyMessages.cooldown.noDays
                .replace('%{hours}', hoursString)
                .replace('%{minutes}', minutesString)
                .replace('%{seconds}', secondsString);
        }
    }

    createSuccessEmbed(client, ctx, emoji, totalCoins, totalExp, now, weeklyMessages, generalMessages, bonusMessage) {
        return client
            .embed()
            .setColor(client.config.color.main)
            .setThumbnail(client.utils.emojiToImage(`${now.hour() >= 6 && now.hour() < 18 ? `${emoji.time.day}` : `${emoji.time.night}`}`))
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐖𝐄𝐄𝐊𝐋𝐘")
                    .replace('%{mainRight}', emoji.mainRight) +
                weeklyMessages.success
                    .replace('%{coin}', client.utils.formatNumber(totalCoins))
                    .replace('%{coinEmote}', emoji.coin)
                    .replace('%{expEmote}', emoji.exp)
                    .replace('%{exp}', client.utils.formatNumber(totalExp))
                    .replace('%{bonusMessage}', bonusMessage)
            )
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });
    }
};
