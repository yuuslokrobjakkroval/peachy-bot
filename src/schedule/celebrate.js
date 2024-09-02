const cron = require('node-cron')
const Users = require('../schemas/user.js');
const config = require('../config.js');
const { connect, connection } = require('mongoose');

async function connectMongodb() {
    if ([1, 2, 99].includes(connection.readyState)) return;
    await connect(config.database);
}

async function updateBirthdayAcknowledged() {
    console.log('func exec');
    connectMongodb();
    const today = new Date();
    const todayDay = today.getDate().toString().padStart(2, '0'); // Day (DD)
    const todayMonth = today.toLocaleString('default', {month: 'short'}).toUpperCase(); // Month (MMM)
    const todayString = `${todayDay}-${todayMonth}`; // Format as DD-MMM

    try {
        // Find users with a birthday today
        const usersWithBirthdayToday = await Users.find({
            'profile.birthday': todayString,
            'profile.birthdayAcknowledged': false
        });

        if (usersWithBirthdayToday.length > 0) {
            // Update `birthdayAcknowledged` field
            await Users.updateMany(
                {
                    'profile.birthday': todayString
                },
                {
                    $set: {'profile.birthdayAcknowledged': true}
                }
            );
            console.log('Updated birthdayAcknowledged for users with birthdays today');

            // Send a birthday alert to the channel
            const birthdayChannelId = process.env.BIRTHDAY_CHANNEL_ID;
            const channel = await client.channels.fetch(birthdayChannelId);
            if (channel) {
                // Create an embed message
                const embed = new this.client.embed()
                    .setTitle('🎉 Happy Birthday! 🎂')
                    .setDescription(usersWithBirthdayToday.map(user => `🎉 ${user.username} (${user.profile.birthday})`).join('\n'))
                    .setColor('#FF0000') // Customize the embed color
                    .setImage('https://i.imgur.com/CkIglgR.gif')
                    .setTimestamp();

                await channel.send({embeds: [embed]});
                console.log('Sent birthday alerts to the channel');
            } else {
                console.error('Channel not found');
            }

        }
        await Users.updateMany(
            {},
            {
                $set: {'profile.birthdayAcknowledged': true}
            }
        ).exec()
        console.log('END:: uBirthdayAcknowledged was updated successfully');
    } catch (e) {
        console.log('error: ', e);
    }
}

const happyBirthday = cron.schedule(process.env.SCHEDULE_RESET_DAILY_TASK, async () => {
    console.log('Cron job Reset Daily Transfer executed at:', new Date().toLocaleString());
    try{
        await updateBirthdayAcknowledged()
    } catch(e){
        console.log(e)
    }
})

module.exports = { happyBirthday };
