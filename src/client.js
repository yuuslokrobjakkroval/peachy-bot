const { GatewayIntentBits } = require('discord.js');
const GiveawaySchema = require('./schemas/giveaway');
const GiveawayShopItemSchema = require('./schemas/giveawayShopItem');
const InviteSchema = require("./schemas/inviteTracker");
const ResponseSchema = require('./schemas/response');
const globalConfig = require('./utils/Config');
const PeachyClient = require('./structures/Client.js');
const { GuildMembers, MessageContent, GuildVoiceStates, GuildMessages, Guilds, GuildInvites, GuildMessageTyping, GuildMessageReactions } = GatewayIntentBits;

let inviteData = {};

const clientOptions = {
    intents: [Guilds, GuildMessages, GuildInvites, MessageContent, GuildVoiceStates, GuildMembers, GuildMessageTyping, GuildMessageReactions],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
    },
};

const client = new PeachyClient(clientOptions);

client.once('ready', async () => {
    const guild = client.guilds.cache.get(globalConfig.guildId);
    if (guild) {
        try {
            const invites = await guild.invites.fetch();
            inviteData[guild.id] = new Map(invites.map(invite => [invite.code, invite.uses]));
        } catch (error) {
            console.error(`Failed to fetch invites for guild ${guild.name}:`, error);
            if (error.code === 50013) {
                console.error('Missing Permissions: Ensure the bot has the Manage Server permission.');
            }
        }
    } else {
        console.error("Bot is not in the specified guild or the guild ID is incorrect.");
    }
});

// Track when a new member joins
client.on('guildMemberAdd', async (member) => {
    const guild = member.guild;
    if (guild.id !== globalConfig.guildId) return;

    const roleId = member.user.bot ? '1271685844700233740' : '1271685844700233741';
    const role = guild.roles.cache.get(roleId);

    if (role) {
        member.roles.add(role).catch(console.error);
    }

    const welcomeChannel = guild.channels.cache.get(globalConfig.channel.welcome);
    if (welcomeChannel) {
        const welcomeMessage = client.utils.getWelcomeMessage(client, member);
        welcomeChannel.send({ embeds: [welcomeMessage] });
    }

    try {
        const currentInvites = await guild.invites.fetch();
        for (const invite of currentInvites.values()) {
            if (inviteData[guild.id] && inviteData[guild.id].has(invite.code)) {
                if (invite.uses > inviteData[guild.id].get(invite.code)) {
                    const inviter = invite.inviter;
                    inviteData[guild.id].set(invite.code, invite.uses);
                    const trackingChannel = guild.channels.cache.get(globalConfig.channel.inviteTracker);
                    if (trackingChannel) {
                        const inviteMessage = client.utils.getInviteMessage(client, member, invite, inviter);
                        trackingChannel.send({embeds: [inviteMessage]});
                    }
                    break;
                }
            }
        }
        inviteData[guild.id] = new Map(currentInvites.map(invite => [invite.code, invite.uses]));
    } catch (error) {
        console.error(`Failed to fetch or update invites for guild ${guild.name}:`, error);
        if (error.code === 50013) {
            console.error('Missing Permissions: Ensure the bot has the Manage Server permission.');
        }
    }

    const chatChannel = guild.channels.cache.get(globalConfig.channel.chat);
    const welcomeMessages = ['sur sdey', 'reab sur', 'សួស្តី', 'សួស្តីបង'];

    if (chatChannel) {
        chatChannel.send({
            content: `${client.utils.getRandomElement(welcomeMessages)} <@${member.id}>!`,
        });
    }
});

client.on('messageCreate', async (message) => {
    if (message.guild.id !== globalConfig.guildId || message.author.bot) return;

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

client.on('guildMemberRemove', member => {
    if (member.guild.id !== globalConfig.guildId) return;

    const goodbyeChannel = member.guild.channels.cache.get(globalConfig.channel.goodbye);

    if (goodbyeChannel) {
        const goodbyeMessage = client.utils.getGoodbyeMessage(client, member);
        goodbyeChannel.send({ embeds: [goodbyeMessage] });
    }
});

setInterval(() => {
    const guild = client.guilds.cache.get(globalConfig.guildId);
    if (!guild) {
        console.error('Guild not found');
        return;
    }

    guild.invites.fetch()
        .then((invites) => {
            if (!invites || invites.length === 0) {
                return;
            }
            const inviteCodes = invites.map(invite => invite.code);

            InviteSchema.find({ guildId: guild.id })
                .then((dbInvites) => {
                    dbInvites.forEach((dbInvite) => {
                        if (!inviteCodes.includes(dbInvite.inviteCode)) {
                            dbInvite.deleteOne()
                                .catch((error) => console.error('Error deleting invite from DB:', error));
                        }
                    });

                    // Iterate over current invites and update the database
                    const invitePromises = invites.map((invite) => {
                        return InviteSchema.findOne({ inviteCode: invite.code })
                            .then((existingInvite) => {
                                if (!existingInvite) {
                                    // Save a new invite record if it doesn't exist
                                    const newInvite = new InviteSchema({
                                        guildId: guild.id,
                                        inviteCode: invite.code,
                                        uses: invite.uses,
                                        userId: [],
                                        inviterId: invite.inviter.id,
                                        inviterTag: invite.inviter.tag,
                                    });
                                    return newInvite.save().catch((error) => console.error('Error saving new invite:', error));
                                } else {
                                    existingInvite.uses = invite.uses;
                                    return existingInvite.save().catch((error) => console.error('Error updating existing invite:', error));
                                }
                            })
                            .catch((error) => console.error('Error finding invite in DB:', error));
                    });

                    return Promise.all(invitePromises);
                }).catch((error) => console.error('Error processing invites from DB:', error));
        }).catch((error) => console.error('Error fetching invites:', error));
}, 60000);

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
}, 60000);

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
}, 60000);

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
}, client.utils.getDelayUntil7PM());

client.start(globalConfig.token);
