const { Command } = require('../../structures/index.js');
const { checkCooldown, updateCooldown, getCooldown } = require('../../functions/function');
const Users = require('../../schemas/user.js');
const chance = require('chance').Chance();
const moment = require('moment');
const emojiImage = require("../../utils/Emoji");

module.exports = class Goma extends Command {
    constructor(client) {
        super(client, {
            name: 'goma',
            description: {
                content: 'Earn some coins by being goma.',
                examples: ['goma'],
                usage: 'goma',
            },
            category: 'economy',
            aliases: ['g'],
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
        const gomaMessages = language.locales.get(language.defaultLocale)?.economyMessages?.gomaMessages;

        try {
            // Fetch user data
            const user = await Users.findOne({ userId: ctx.author.id }).exec();
            const verify = user.verification.verify.status === 'verified';

            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, gomaMessages.errors.noUser, color);
            }

            const baseCoins = chance.integer({ min: 400, max: 500 });
            const newBalance = user.balance.coin + baseCoins;
            const newStreak = user.goma.streak + 1;

            const cooldownTime = 300000; // 5 minutes cooldown
            const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

            if (!isCooldownExpired) {
                const lastCooldownTimestamp = await getCooldown(ctx.author.id, this.name.toLowerCase());
                const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                const duration = moment.duration(remainingTime, 'seconds');
                const minutes = Math.floor(duration.asMinutes());
                const seconds = Math.floor(duration.asSeconds()) % 60;

                const cooldownMessage = gomaMessages.cooldown
                    .replace('%{minutes}', minutes)
                    .replace('%{seconds}', seconds);

                const cooldownEmbed = client.embed()
                    .setColor(color.red)
                    .setDescription(cooldownMessage);

                return await ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            // Update balance and streak
            await Promise.all([
                Users.updateOne({ userId: ctx.author.id }, {
                    $set: {
                        'balance.coin': newBalance,
                        'goma.streak': newStreak
                    }
                }).exec(),
                updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime),
            ]);

            // Display success embed
            const successEmbed = client.embed()
                .setColor(color.main)
                .setTitle(`${ctx.author.displayName} ${gomaMessages.success.title}`)
                .setDescription(
                    gomaMessages.success.description
                        .replace('%{coinEmote}', emoji.coin)
                        .replace('%{coin}', client.utils.formatNumber(baseCoins))
                )
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
                })

            return await ctx.sendMessage({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error processing Goma command:', error);
            return await client.utils.sendErrorMessage(client, ctx, gomaMessages.errors.fetchFail, color);
        }
    }
};
