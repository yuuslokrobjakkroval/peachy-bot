const { Command } = require('../../structures/index.js');
const { checkCooldown, updateCooldown, getCooldown } = require('../../functions/function');
const Users = require('../../schemas/user.js');
const chance = require('chance').Chance();
const moment = require('moment');
const { peachTasks } = require('../../utils/TaskUtil.js');


module.exports = class Peachy extends Command {
    constructor(client) {
        super(client, {
            name: 'peachy',
            description: {
                content: 'Earn some coins by being peachy.',
                examples: ['peachy'],
                usage: 'peachy',
            },
            category: 'economy',
            aliases: ['p'],
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
        const newStreak = (user.peachy.streak += 1);

        const timeExpired = 300000; // 5 minutes cooldown
        const isCooldownExpired = await checkCooldown(ctx.author.id, this.name.toLowerCase(), timeExpired);

        if (!isCooldownExpired) {
            const lastCooldownTimestamp = await getCooldown(ctx.author.id, this.name.toLowerCase());
            const remainingTime = Math.ceil((lastCooldownTimestamp + timeExpired - Date.now()) / 1000);

            const duration = moment.duration(remainingTime, 'seconds');

            const minutes = Math.floor(duration.asMinutes());
            const seconds = Math.floor(duration.asSeconds()) % 60;

            const cooldownMessage = `Peachy is on cooldown!\nTry again after **${minutes}mins and ${seconds}secs**.`;

            const cooldownEmbed = client.embed().setColor(client.color.red).setDescription(cooldownMessage);

            return await ctx.sendMessage({ embeds: [cooldownEmbed] });
        }

        // Update balance and streak
        await Promise.all([
            Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'peachy.streak': newStreak } }).exec(),
            updateCooldown(ctx.author.id, this.name.toLowerCase(), timeExpired)
        ]);

        // Check and update daily tasks
        const updatedTasks = user.dailyTasks.map(task => {
            if (task.type === 'peach' && !task.completed) {
                task.progress += 1; // Increment progress
                if (task.progress >= peachTasks.find(t => t.id === task.id).requiredAmount) {
                    task.completed = true; // Mark as completed
                }
            }
            return task;
        });

        await Users.updateOne({ userId: ctx.author.id }, { $set: { dailyTasks: updatedTasks } }).exec();

        // Display Embed
        const embed = client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${ctx.author.displayName} is peachy!`)
            .setDescription(
                client.i18n.get(language, 'commands', 'beg_success', {
                    coinEmote: client.emote.coin,
                    coin: client.utils.formatNumber(baseCoins),
                })
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
