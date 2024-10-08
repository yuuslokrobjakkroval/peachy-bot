const cron = require('node-cron');
const User = require('../schemas/user');
const Giveaway = require('../schemas/giveaway');
const config = require('../config.js');
const { connect, connection } = require("mongoose");
const logger = require("node-cron/src/scheduler");

async function connectMongodb() {
    if ([1, 2, 99].includes(connection.readyState)) return;
    await connect(config.database);
}

// Function to check for and celebrate birthdays
async function checkBirthdays(client) {
    console.log('Check Birthday Start');
    try {
        await connectMongodb();
        const today = new Date();

        const options = { day: '2-digit', month: 'short' };
        const todayDate = today.toLocaleDateString('en-GB', options).replace('.', '');

        const usersWithBirthdayToday = await User.find({
            'profile.birthday': todayDate,
            'profile.birthdayAcknowledged': false,
        });

        const birthdayChannel = client.channels.cache.get('1272074580797952116');

        if (!birthdayChannel) {
            console.error(`[Birthday] Birthday channel not found.`);
            return;
        }

        for (const user of usersWithBirthdayToday) {
            const giftBalance = Math.floor(Math.random() * (1000000 - 500000 + 1)) + 500000;
            const [day, month, year] = user.profile.birthday.split('-');
            const xp = parseInt(day) + (new Date(Date.parse(`${month} 1, 2020`)).getMonth() + 1) + parseInt(year.slice(-2));

            const birthdayEmbed = client.embed()
                .setColor(color.main)
                .setTitle(`🎉 Happy Birthday, ${user.profile.username || user.username}! 🎂`)
                .setDescription(`On this special day, we celebrate you and all the joy you bring into our lives! May your year ahead be filled with exciting adventures, unforgettable moments, and everything you've ever wished for. Remember, you are loved and cherished by all of us! 🎈`)
                .addFields(
                    {name: '🎁 Your Birthday Gift:', value: `${giftBalance} coins`, inline: true},
                    {name: '✨ Your Birthday XP::', value:  `${xp} XP`, inline: true}
                )
                .setFooter('Have an amazing birthday filled with love and happiness!')
                .setTimestamp();

            await birthdayChannel.send({ embeds: [birthdayEmbed] });

            user.profile.birthdayAcknowledged = true;
            user.balance.coin += giftBalance;
            user.profile.xp += xp;
            await user.save();
        }
        console.log('Check Birthday Ended');
    } catch (err) {
        console.error(`[Birthday] Error fetching birthdays: ${err.message}`);
    }
}

// Function to check for and end giveaways
async function startScheduledTasks(client) {
    console.log('Check Giveaway Start');
    try {
        await connectMongodb();
        const currentTime = Date.now();
        const giveaways = await Giveaway.find({
            endTime: { $lte: currentTime },
            ended: false,
        });

        for (const giveaway of giveaways) {
            const guild = client.guilds.cache.get(giveaway.guildId);
            if (!guild) continue;

            const channel = guild.channels.cache.get(giveaway.channelId);
            if (!channel) continue;

            try {
                const message = await channel.messages.fetch(giveaway.messageId);
                await client.utils.endGiveaway(client, message, giveaway.autopay);

            } catch (err) {
                console.error(`[Giveaway] Error ending giveaway: ${err.message}`);
            }
        }
        console.log('Check Giveaway Ended');
    } catch (err) {
        console.error(`[Giveaway] Error fetching giveaways: ${err.message}`);
    }
}

// Start scheduled tasks
function startScheduledTasks(client) {
    // Schedule the birthday check every day at 7AM
    cron.schedule('0 7 * * *', () => {
        checkBirthdays(client).then(r => logger.start(`[Giveaway] Scheduled tasks started: ${r}`));
    });

    // // Schedule the giveaway check every hour
    // cron.schedule('0 * * * *', () => {
    //     checkGiveaways(client);
    // });
}

module.exports = { startScheduledTasks };
