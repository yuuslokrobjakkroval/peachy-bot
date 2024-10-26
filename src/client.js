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
        // Check if the bot has permission to manage roles
        if (member.guild.me.permissions.has('MANAGE_ROLES')) {
            member.roles.add(role)
                .then(() => console.log(`Role ${role.name} assigned to ${member}.`))
                .catch(err => {
                    console.error('Error assigning role:', err);
                    // Additional error handling logic can go here if needed
                });
        } else {
            console.error('Missing Manage Roles permission for the bot.');
        }
    } else {
        console.error(`Role with ID ${roleId} not found.`);
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
            files: ['https://i.imgur.com/HJgHXVW.jpg'] // Replace with your image URL
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
            files: ['https://i.imgur.com/AyHSD1E.png']
        });
    }
});

client.start(config.token);
