const Users = require("../schemas/user.js");

async function happyBirthday() {
    console.log('Function executed');

    const today = new Date();
    const todayDay = today.getDate().toString().padStart(2, '0'); // Day (DD)
    const todayMonth = today.toLocaleString('default', { month: 'short' }).toUpperCase(); // Month (MMM)
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
                    $set: { 'profile.birthdayAcknowledged': true }
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

                await channel.send({ embeds: [embed] });
                console.log('Sent birthday alerts to the channel');
            } else {
                console.error('Channel not found');
            }

        } else {
            console.log('No users with birthdays today');
        }

    } catch (error) {
        console.error('Error updating users:', error);
    }
}

module.exports = { happyBirthday };
