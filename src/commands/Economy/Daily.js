const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');
const { checkCooldown, updateCooldown } = require('../../functions/function');
const chance = require('chance').Chance();
const moment = require('moment');

module.exports = class Daily extends Command {
    constructor(client) {
        super(client, {
            name: 'daily',
            description: {
                content: 'Earn some coins daily.',
                examples: ['daily'],
                usage: 'daily',
            },
            category: 'economy',
            aliases: ['daily'],
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
        try {
            const user = await Users.findOne({ userId: ctx.author.id }).exec();
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, 'User not found.');
            }

            const { coin, bank } = user.balance;
            const baseCoins = chance.integer({ min: 300000, max: 500000 });
            const newBalance = coin + baseCoins;
            const now = moment();
            const next7AM = moment().add(1, 'days').set({ hour: 7, minute: 0, second: 0, millisecond: 0 });
            const timeUntilNext7AM = moment.duration(next7AM.diff(now));
            const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNext7AM);

            function getEmojiForTime() {
                const hours = moment().hour();
                const isDaytime = hours >= 6 && hours < 18;
                console.log(isDaytime)

                return isDaytime ? `${client.emoji.time.day}` : `${client.emoji.time.night}`;
            }

            if (!isCooldownExpired) {
                const duration = moment.duration(next7AM.diff(now));
                const hours = Math.floor(duration.asHours());
                const minutes = Math.floor(duration.asMinutes()) % 60;
                const seconds = Math.floor(duration.asSeconds()) % 60;

                const cooldownMessage = `Daily is on cooldown!\nTry again after **${hours}hrs, ${minutes}mins and ${seconds}secs**.`;

                const cooldownEmbed = client.embed().setColor(client.color.red).setDescription(cooldownMessage);

                return await ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            const baseExp = chance.integer({ min: 100, max: 150 });
            const newExp = user.profile.exp + baseExp;

            await Promise.all([
                Users.updateOne({ userId: ctx.author.id }, {
                    $set: {
                        'balance.coin': newBalance,
                        'balance.bank': bank,
                        'profile.exp': newExp,
                    }
                }).exec(),
                updateCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNext7AM)
            ]);

            const embed = client
                .embed()
                .setColor(client.color.main)
                .setTitle(`${ctx.author.displayName} claimed their daily reward! ${getEmojiForTime()}`)
                .setDescription(
                    client.i18n.get(language, 'commands', 'daily_success', {
                        coinEmote: client.emoji.coin,
                        coin: client.utils.formatNumber(baseCoins),
                        exp: client.utils.formatNumber(baseExp),
                    })
                );

            return await ctx.sendMessage({ embeds: [embed] });

        } catch (error) {
            console.error('Error processing daily command:', error);
            return client.utils.sendErrorMessage(client, ctx, 'There was an error processing your daily claim.');
        }
    }
};
