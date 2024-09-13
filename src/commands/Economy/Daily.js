const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');
const { checkCooldown, updateCooldown } = require('../../functions/function');
const chance = require('chance').Chance();
const moment = require('moment-timezone');

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

            const now = moment().tz('Asia/Bangkok');
            const hours = now.hour();

            let nextDate = now;
            if(now.isAfter(moment().tz('Asia/Bangkok').hour(15).minute(0).second(0))) {
                nextDate = moment().tz('Asia/Bangkok').add(1, 'days')
            }
            const next5PM = nextDate.set({ hour: 17, minute: 0, second: 0, millisecond: 0 });

            const timeUntilNext5PM = moment.duration(next5PM.diff(now));
            const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNext5PM);

            if (!isCooldownExpired) {
                const duration = moment.duration(next5PM.diff(now));

                const hours = Math.floor(duration.asHours());
                const minutes = Math.floor(duration.asMinutes()) % 60;
                const seconds = Math.floor(duration.asSeconds()) % 60;

                const cooldownMessage = `Daily is on cooldown!\nTry again after **${hours}hrs, ${minutes}mins and ${seconds}secs**.`;

                const cooldownEmbed = client.embed().setColor(client.color.red).setDescription(cooldownMessage);

                return await ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            const baseExp = chance.integer({ min: 100, max: 150 });
            const newExp = user.profile.xp + baseExp;

            await Promise.all([
                Users.updateOne({ userId: ctx.author.id }, {
                    $set: {
                        'balance.coin': newBalance,
                        'balance.bank': bank,
                        'profile.xp': newExp,
                    }
                }).exec(),
                updateCooldown(ctx.author.id, this.name.toLowerCase(), timeUntilNext5PM)
            ]);

            console.log(hours >= 6 && hours < 18)
            const embed = client
                .embed()
                .setColor(client.color.main)
                .setTitle(`${ctx.author.displayName} claimed their daily reward! ${hours >= 6 && hours < 18 ? `${client.emoji.time.day}` : `${client.emoji.time.night}`}`)
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
