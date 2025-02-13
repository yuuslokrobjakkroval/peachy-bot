const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const chance = require("chance").Chance();
const moment = require("moment");

module.exports = class Goma extends Command {
    constructor(client) {
        super(client, {
            name: "goma",
            description: {
                content: "𝑬𝒂𝒓𝒏 𝒔𝒐𝒎𝒆 𝒄𝒐𝒊𝒏𝒆𝒔 𝒃𝒚 𝒃𝒆𝒊𝒏𝒈 𝒈𝒐𝒎𝒂.",
                examples: ["𝒈𝒐𝒎𝒂"],
                usage: "𝒈𝒐𝒎𝒂",
            },
            category: "economy",
            aliases: ["g"],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const gomaMessages = language.locales.get(language.defaultLocale)?.economyMessages?.gomaMessages;

        try {
            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const baseCoins = chance.integer({ min: 400, max: 500 });
            const baseExp = chance.integer({ min: 5, max: 10 });

            let bonusCoins = 0;
            let bonusExp = 0;

            const verify = user.verification.verify.status === "verified";
            if (verify) {
                bonusCoins = Math.floor(baseCoins * 0.4);
                bonusExp = Math.floor(baseExp * 0.4);
            }

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;
            const newBalance = user.balance.coin + totalCoins;
            const newExp = user.profile.xp + totalExp;
            const newStreak = user.goma.streak + 1;

            const cooldownTime = 300000; // 5 minutes cooldown
            const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

            if (!isCooldownExpired) {
                const lastCooldownTimestamp = await client.utils.getCooldown(ctx.author.id, this.name.toLowerCase());
                const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                const duration = moment.duration(remainingTime, "seconds");
                const minutes = Math.floor(duration.asMinutes());
                const seconds = Math.floor(duration.asSeconds()) % 60;

                const cooldownMessage = gomaMessages.cooldown
                    .replace("%{minutes}", minutes)
                    .replace("%{seconds}", seconds);

                const cooldownEmbed = client.embed().setColor(color.danger).setDescription(cooldownMessage);
                return ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            await Users.updateOne(
                { userId: user.userId },
                {
                    $set: {
                        "balance.coin": newBalance,
                        "profile.xp": newExp,
                        "goma.streak": newStreak,
                    },
                }
            );

            await client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

            let bonusMessage = "";
            if (bonusCoins > 0 || bonusExp > 0) {
                bonusMessage = `\n****+40% Bonus****\n${emoji.coin}: ****+${client.utils.formatNumber(bonusCoins)}**** coins\n${emoji.exp} ****+${client.utils.formatNumber(bonusExp)}**** xp`;
            }

            const successEmbed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace("%{mainLeft}", emoji.mainLeft)
                        .replace("%{title}", "𝐆𝐎𝐌𝐀")
                        .replace("%{mainRight}", emoji.mainRight) +
                    gomaMessages.success
                        .replace("%{coinEmote}", emoji.coin)
                        .replace("%{coin}", client.utils.formatNumber(baseCoins))
                        .replace("%{expEmote}", emoji.exp)
                        .replace("%{exp}", client.utils.formatNumber(baseExp))
                        .replace("%{bonusMessage}", bonusMessage)
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [successEmbed] });

        } catch (error) {
            console.error("Error processing goma command:", error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
