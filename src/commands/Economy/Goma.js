const { Command } = require('../../structures/index.js');
const { checkCooldown, updateCooldown, getCooldown } = require('../../functions/function');
const Users = require('../../schemas/user.js');
const chance = require('chance').Chance();
const moment = require('moment');


module.exports = class Peachy extends Command {
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
        const user = await Users.findOne({ userId: ctx.author.id }).exec();

        if (!user) {
            return await ctx.sendMessage({ content: 'User not found.' });
        }

        const baseCoins = chance.integer({ min: 1000, max: 5000 });
        const newBalance = user.balance.coin + baseCoins;
        const newStreak = (user.goma.streak += 1);

        const timeExpired = 300000; // 5 minutes cooldown
        const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeExpired);

        if (!isCooldownExpired) {
            const lastCooldownTimestamp = await getCooldown(ctx.author.id, this.name.toLowerCase());
            const remainingTime = Math.ceil((lastCooldownTimestamp + timeExpired - Date.now()) / 1000);

            const duration = moment.duration(remainingTime, 'seconds');

            const minutes = Math.floor(duration.asMinutes());
            const seconds = Math.floor(duration.asSeconds()) % 60;

            const cooldownMessage = `Goma is on cooldown!\nTry again after **${minutes}mins and ${seconds}secs**.`;

            const cooldownEmbed = client.embed().setColor(color.red).setDescription(cooldownMessage);

            return await ctx.sendMessage({ embeds: [cooldownEmbed] });
        }

        // Update balance and streak
        await Promise.all([
            Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'goma.streak': newStreak } }).exec(),
            updateCooldown(ctx.author.id, this.name.toLowerCase(), timeExpired)
        ]);

        // Display Embed
        const embed = client
            .embed()
            .setColor(color.main)
            .setTitle(`${ctx.author.displayName} have claimed goma!`)
            .setDescription(
                client.i18n.get(language, 'commands', 'beg_success', {
                    coinEmote: emoji.coin,
                    coin: client.utils.formatNumber(baseCoins),
                })
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
