const { Command } = require('../../structures/index.js');
const { checkCooldown, updateCooldown, getCooldown } = require('../../functions/function');
const Users = require('../../schemas/User.js');
const chance = require('chance').Chance();
const moment = require('moment');

module.exports = class Daddy extends Command {
    constructor(client) {
        super(client, {
            name: 'dd',
            description: {
                content: 'Earn some coins by daddy.',
                examples: ['dd'],
                usage: 'dd',
            },
            category: 'economy',
            aliases: ['d'],
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

    async run(client, ctx, args, language) {
        const user = await Users.findOne({ userId: ctx.author.id }).exec();

        if (!user) {
            return await ctx.sendMessage({ content: 'User not found.' });
        }

        const baseCoins = chance.integer({ min: 500, max: 1000 });
        const newBalance = user.balance.coin + baseCoins;
        const newStreak = (user.daddy.streak += 1);

        const timeExpired = 300000; // 4 minutes cooldown
        const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeExpired);

        if (!isCooldownExpired) {
            const lastCooldownTimestamp = await getCooldown(ctx.author.id, this.name.toLowerCase());
            const remainingTime = Math.ceil((lastCooldownTimestamp + timeExpired - Date.now()) / 1000);

            const duration = moment.duration(remainingTime, 'seconds');

            const minutes = Math.floor(duration.asMinutes());
            const seconds = Math.floor(duration.asSeconds()) % 60;

            const cooldownMessage = `Daddyed is on cooldown!\nTry again after **${minutes}mins and ${seconds}secs**.`;

            const cooldownEmbed = client.embed().setColor(client.color.red).setDescription(cooldownMessage);

            return await ctx.sendMessage({ embeds: [cooldownEmbed] });
            // return await client.utils.sendErrorMessage(
            //     client,
            //     ctx,
            //     `You have already daddyed recently! Please wait <t:${Math.round(Date.now() / 1000) + remainingTime}:R>.`,
            //     remainingTime * 1000
            // );
        }

        await Promise.all([
            Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'daddy.streak': newStreak } }).exec(),
            updateCooldown(ctx.author.id, this.name.toLowerCase(), timeExpired)
        ]);

        // Display Embed
        const embed = client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${ctx.author.displayName} daddyed!`)
            .setDescription(
                client.i18n.get(language, 'commands', 'beg_success', {
                    coinEmote: client.emote.coin,
                    coin: client.utils.formatNumber(baseCoins),
                })
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};