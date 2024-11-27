const { GatewayIntentBits } = require('discord.js');
const Users = require('./schemas/user');
const GiveawaySchema = require('./schemas/giveaway');
const GiveawayShopItemSchema = require('./schemas/giveawayShopItem');
const InviteSchema = require("./schemas/inviteTracker");
const globalConfig = require('./utils/Config');
const PeachyClient = require('./structures/Client.js');
const { GuildMembers, MessageContent, GuildVoiceStates, GuildMessages, Guilds, GuildInvites, GuildMessageTyping, GuildMessageReactions } = GatewayIntentBits;

const clientOptions = {
    intents: [Guilds, GuildMessages, GuildInvites, MessageContent, GuildVoiceStates, GuildMembers, GuildMessageTyping, GuildMessageReactions],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
    },
};

const client = new PeachyClient(clientOptions);

client.once('ready', async () => {
    return await client.abilities.syncInvites(client)
});

client.on('guildMemberAdd', async (member) => {
    return await client.abilities.getWelcomeMessage(client, member);
});

client.on('messageCreate', async (message) => {
    return await client.abilities.getAutoResponse(client, message);
});

client.on('guildMemberRemove', async (member) => {
    try {
        await client.abilities.getGoodByeMessage(client, member);
    } catch (error) {
        console.error('Error in getGoodByeMessage:', error);
    }
});

client.on('inviteCreate', async (invite) => {
    await client.abilities.getInviteCreate(invite);
});


client.on('inviteDelete', async (invite) => {
    await client.abilities.getInviteDelete(invite);
});

setInterval(async () => {
    return await client.abilities.getSendMessage(client);
}, 1000);

setInterval(() => {
    const guild = client.guilds.cache.get(client.config.guildId);
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
