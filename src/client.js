const { GatewayIntentBits } = require('discord.js');
const GiveawaySchema = require('./schemas/giveaway');
const GiveawayShopItemSchema = require('./schemas/giveawayShopItem');
const Invites = require('./schemas/InviteTracker');
const ResponseSchema = require('./schemas/response');
const config = require('./config.js');
const PeachyClient = require('./structures/Client.js');
const { GuildMembers, MessageContent, GuildVoiceStates, GuildMessages, Guilds, GuildMessageTyping, GuildMessageReactions } = GatewayIntentBits;

function getDelayUntil7PM() {
    const now = new Date();
    const sevenPM = new Date();
    sevenPM.setHours(19, 0, 0, 0); // 7:00 PM today
    if (now > sevenPM) {
        sevenPM.setDate(sevenPM.getDate() + 1);
    }

    return sevenPM - now;
}

const initialDelay = getDelayUntil7PM();

const clientOptions = {
    intents: [Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers, GuildMessageTyping, GuildMessageReactions],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
    },
};

const client = new PeachyClient(clientOptions);

// Track when a new member joins
client.on('guildMemberAdd', async (member) => {
    if (member.guild.id !== config.guildId) return;

    const roleId = member.user.bot ? '1271685844700233740' : '1271685844700233741';
    const role = member.guild.roles.cache.get(roleId);

    if (role) {
        member.roles.add(role).catch(console.error);
    }

    const channelId = '1299416615275987025';
    const welcomeChannel = member.guild.channels.cache.get(channelId);
    if (welcomeChannel) {
        const welcomeMessage = client.utils.getWelcomeMessage(client, member);
        welcomeChannel.send({ embeds: [welcomeMessage] });
    }

    try {
        const invites = await member.guild.invites.fetch();
        for (const invite of invites.values()) {
            let storedInvite = await Invites.findOne({ guildId: member.guild.id, inviteCode: invite.code });
            if (storedInvite && invite.uses > storedInvite.uses) {
                const trackingChannelId = '1299416717293781124';
                const trackingChannel = member.guild.channels.cache.get(trackingChannelId);
                if (trackingChannel) {
                    const inviteMessage = client.utils.getInviteMessage(client, member, invite);
                    trackingChannel.send({ embeds: [inviteMessage] });
                }
                storedInvite.uses = invite.uses;
                await storedInvite.save();
                break;
            }
        }


    } catch (error) {
        console.error('Error fetching or saving invite data:', error);
    }

    const chatChannelId = '1271685845165936729';
    const chatChannel = member.guild.channels.cache.get(chatChannelId);
    const welcomeMessages = ['sur sdey', 'reab sur', 'សួស្តី', 'សួស្តីបង'];

    if (chatChannel) {
        chatChannel.send({
            content: `${this.client.utils.getRandomElement(welcomeMessages)} <@${member.id}>!`,
        });
    }
});

client.on('messageCreate', async (message) => {
    if (message.guild.id !== config.guildId || message.author.bot) return;

    try {
        const responseDoc = await ResponseSchema.findOne({ guildId: message.guild.id });
        if (!responseDoc || !responseDoc.autoresponse || responseDoc.autoresponse.length === 0) return;
        const matchingResponses = responseDoc.autoresponse.filter(response =>
            message.content.toLowerCase() === response.trigger.toLowerCase()
        );
        if (matchingResponses.length > 0) {
            const randomResponse = matchingResponses[Math.floor(Math.random() * matchingResponses.length)];
            message.reply(randomResponse.response);
        }
    } catch (error) {
        console.error('Error processing auto-responses:', error);
    }
});
// Member leaves
client.on('guildMemberRemove', member => {
    if (member.guild.id !== config.guildId) return;

    const goodbyeChannelId = '1299416504575459380';
    const goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);

    if (goodbyeChannel) {
        const goodbyeMessage = client.utils.getGoodbyeMessage(client, member);
        goodbyeChannel.send({ embeds: [goodbyeMessage] });
    }
});


setInterval(() => {
    const now = Date.now();
    GiveawaySchema.find({ endTime: { $lte: now }, ended: false })
        .then((giveaways) => {
            if (!giveaways || giveaways.length === 0) {
                return;
            }

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
        .catch((err) => {
            console.error('Error finding giveaways:', err);
        });
}, 10000);

setInterval(() => {
    const now = Date.now();
    GiveawayShopItemSchema.find({ endTime: { $lte: now }, ended: false })
        .then((giveaways) => {
            if (!giveaways || giveaways.length === 0) {
                return;
            }

            giveaways.forEach((giveaway) => {
                if (giveaway) {
                    client.channels.cache.get(giveaway.channelId)?.messages.fetch(giveaway.messageId)
                        .then((giveawayMessage) => {
                            if (giveawayMessage) {
                                client.utils.endGiveawayShopItem(client, client.color, client.emoji, giveawayMessage, giveaway.autoAdd)
                                    .then(() => {
                                        giveaway.ended = true;
                                        return giveaway.save();
                                    })
                                    .catch((err) => console.error('Error ending giveaway shop item:', err));
                            }
                        })
                        .catch((err) => {
                            if (err.code === 10008) {
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
        .catch((err) => {
            console.error('Error finding giveaway shop items:', err);
        });
}, 10000);


// Schedule the first execution
setTimeout(() => {
    client.utils.checkBirthdays(client)
        .then(() => console.log('Birthday check completed.'))
        .catch(err => console.error('Error in checkBirthdays function:', err));

    // Repeat every 24 hours after the initial execution
    setInterval(() => {
        client.utils.checkBirthdays(client)
            .then(() => console.log('Birthday check completed.'))
            .catch(err => console.error('Error in checkBirthdays function:', err));
    }, 24 * 60 * 60 * 1000); // 24 hours
}, initialDelay);

client.start(config.token);
