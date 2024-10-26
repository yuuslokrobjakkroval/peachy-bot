const { GatewayIntentBits } = require('discord.js');
const GiveawaySchema = require('./schemas/giveaway');
const config = require('./config.js');
const PeachyClient = require('./structures/Client.js');
const { GuildMembers, MessageContent, GuildVoiceStates, GuildMessages, Guilds, GuildMessageTyping, GuildMessageReactions } = GatewayIntentBits;

const clientOptions = {
    intents: [Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers, GuildMessageTyping, GuildMessageReactions],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
    },
};

const client = new PeachyClient(clientOptions);

setInterval(() => {
    const now = Date.now();
    GiveawaySchema.find({ endTime: { $lte: now }, ended: false })
        .then((giveaways) => {
            giveaways.forEach((giveaway) => {
                if (giveaway) {
                    client.channels.cache.get(giveaway.channelId)?.messages.fetch(giveaway.messageId)
                        .then((giveawayMessage) => {
                            if (giveawayMessage) {
                                client.utils.endGiveaway(client, client.color, client.emoji, giveawayMessage, giveaway.autopay)
                                    .then(() => {
                                        giveaway.ended = true;
                                        return giveaway.save();
                                    })
                                    .catch((err) => console.error('Error ending giveaway:', err));
                            }
                        })
                        .catch((err) => {
                            if (err.code === 10008) {
                                // Handle the case where the message is not found (Unknown Message)
                                console.warn(`Message with ID ${giveaway.messageId} was not found.`);
                                giveaway.ended = true;
                                giveaway.save().catch(console.error);
                            } else {
                                console.error('Error fetching message:', err);
                            }
                        });
                }
            });
        })
        .catch((err) => console.error('Error finding giveaways:', err));
}, 60000);

// Event listener for new members joining the server
client.on('guildMemberAdd', member => {
    const channelId = '1299416615275987025';
    const welcomeChannel = member.guild.channels.cache.get(channelId);

    // Check if the member is a bot and assign the appropriate role
    const roleId = member.user.bot ? '1271685844700233740' : '1271685844700233741';
    const role = member.guild.roles.cache.get(roleId);

    if (role) {
        member.roles.add(role)
            .then(() => console.log(``))
            .catch(console.error);
    }

    // Ensure the welcome channel exists
    if (welcomeChannel) {
        const memberCount = member.guild.memberCount;

        const welcomeMessage = `
**<:PEACH:1281537106342187102> WELCOME TO ${member.guild.name} SERVER <:GOMA:1281537120644628480>**

<:BORDERTOPLEFT:1283010765519060993>  ═════════════════   <:BORDERTOPRIGHT:1283010784158421047>

> **READ RULES** : <#1271685845165936722>
> **REACT ROLES** : <#1271685845165936723>
> **ANNOUNCEMENTS** : <#1272595713125126176>

<:BORDERBOTTONLEFT:1283010799010578502>  ═════════════════   <:BORDERBOTTONRIGHT:1283010809760452679>

**USER INFO** : ${member}
**NOW WE HAVE \`${memberCount}\` MEMBERS**
        `;

        // Send the welcome message along with an image
        welcomeChannel.send({
            content: welcomeMessage,
            // files: ['https://i.imgur.com/HJgHXVW.jpg'] // Replace with your image URL
        });
    }

    const chatChannelId = '1271685845165936729';
    const chatChannel = member.guild.channels.cache.get(chatChannelId);

    const welcomeMessages = ['sur sdey', 'reab sur', 'សួស្ដី', 'សួស្ដីបង'];
    if (chatChannel) {
        chatChannel.send({
            content: `${client.utils.getRandomElement(welcomeMessages)} <@${member.id}>!`,
        })
    }

    if (member.premiumSince) {
        const boostChannelId = '1271685845165936725'; // Channel ID for boost message
        const boostChannel = member.guild.channels.cache.get(boostChannelId);

        if (boostChannel) {
            const boostMessage = `
**<:PEACH:1281537106342187102> ${member.guild.name} <:GOMA:1281537120644628480>**

សូមអរគុណ ${member} ដែលបាន Boost មកកាន់ Server យើង។ 

យើងរីករាយណាស់ចំពោះការ Boost របស់អ្នក! 
សូមអរគុណសម្រាប់ការគាំទ្រ Server របស់យើង និងធ្វើឱ្យវាល្អបន្តិចសម្រាប់គ្រប់គ្នា। 

We truly appreciate your boost! Thanks for supporting the server and making it better for everyone.
            `;
            boostChannel.send({
                content: boostMessage,
                files: ['https://i.imgur.com/FrTvTpq.gif'] // Replace with your image URL
            });
        }
    }
});

client.on('messageCreate', message => {
    // Prevent the bot from responding to its own messages
    if (message.author.bot) return;

    // Define possible welcome messages in English and Khmer
    const welcomeMessages = ['sur sdey', 'reab sur', 'សួស្ដី', 'សួស្ដីបង'];

    // Check if the message contains any welcome words in either language
    const messageWords = message.content.toLowerCase().split(' ');
    const containsWelcome = messageWords.some(word => welcomeMessages.includes(word));

    // Check if the message content matches any of the greetings
    if (containsWelcome) {
        // Mention the user and respond with an enthusiastic message
        message.channel.send({
            content: `${message.content}! Welcome, ${message.member.displayName}! 🎉 Thanks for joining us!`
        });
    }
});

client.on('guildMemberRemove', member => {
    const goodbyeChannelId = '1299416504575459380';
    const goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);

    // Ensure the goodbye channel exists
    if (goodbyeChannel) {
        const memberCount = member.guild.memberCount;

        const goodbyeMessage = `
**<:PEACH:1281537106342187102> Goodbye from ${member.guild.name} SERVER <:GOMA:1281537120644628480>**

<:BORDERTOPLEFT:1283010765519060993>  ═════════════════   <:BORDERTOPRIGHT:1283010784158421047>

We're sad to see you go, ${member}!

<:BORDERBOTTONLEFT:1283010799010578502>  ═════════════════   <:BORDERBOTTONRIGHT:1283010809760452679>

**NOW WE HAVE \`${memberCount}\` MEMBERS LEFT**
        `;

        goodbyeChannel.send({
            content: goodbyeMessage,
            // files: ['https://i.imgur.com/AyHSD1E.png']
        });
    }
});

client.start(config.token);
