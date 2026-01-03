const { Partials, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Options } = require('discord.js');
const {
    DirectMessages,
    GuildMembers,
    GuildPresences,
    MessageContent,
    GuildVoiceStates,
    GuildMessages,
    Guilds,
    GuildInvites,
    GuildMessageTyping,
    GuildMessageReactions,
} = GatewayIntentBits;
const AntiLinkSchema = require('./schemas/antiLink');
const GiveawaySchema = require('./schemas/giveaway');
const GiveawayShopItemSchema = require('./schemas/giveawayShopItem');
const ConversationSchema = require('./schemas/conversation');
const globalConfig = require('./utils/Config');
const PeachyClient = require('./structures/Client.js');
const EconomyManager = require('./managers/EconomyManager');
const ResourceManager = require('./managers/ResourceManager');
const cron = require('node-cron');

// Khmer language detection regex
const isKhmer = (text) => /[\u1780-\u17FF]/.test(text);

// Detect "peachy" in message content (case-insensitive)
const hasPeachy = (text) => /\bpeachy\b/i.test(text);

// Assuming messageCount is defined globally
const messageCount = new Map();

const clientOptions = {
    intents: [
        DirectMessages,
        Guilds,
        GuildMessages,
        GuildInvites,
        MessageContent,
        GuildVoiceStates,
        GuildMembers,
        GuildPresences,
        GuildMessageTyping,
        GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User, Partials.GuildScheduledEvent],

    makeCache: Options.cacheWithLimits({
        MessageManager: 25,
        GuildMemberManager: {
            max: 100,
            keepOverLimit: (member) =>
                (client.user && member.id === client.user.id) ||
                (member.guild && member.id === member.guild.ownerId) ||
                (member.voice && member.voice.channelId !== null),
        },
        ThreadManager: 10,
    }),

    sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
            interval: 3600,
            lifetime: 1800,
        },

        threads: {
            interval: 3600,
            lifetime: 1800,
        },
        users: {
            interval: 3600,
            filter: () => (user) => user && !user.bot,
        },
    },
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
    },
    autoReconnect: true,
    restTimeOffset: 0,
};

const client = new PeachyClient(clientOptions);

// Initialize ResourceManager
client.resourceManager = new ResourceManager(client);
client.economyManager = new EconomyManager(client);
client.prefixManager = new (require('./managers/PrefixManager'))();
client.logger.info('Economy and Prefix Manager initialized');
client.setMaxListeners(30);

client.once('clientReady', async () => {
    client.utils.cacheItems();

    setInterval(() => {
        const now = Date.now();
        GiveawaySchema.find({ endTime: { $lte: now }, ended: false })
            .then((giveaways) => {
                if (!giveaways || giveaways.length === 0) {
                    return;
                }
                giveaways.forEach((giveaway) => {
                    if (giveaway) {
                        client.channels.cache
                            .get(giveaway.channelId)
                            ?.messages.fetch(giveaway.messageId)
                            .then((giveawayMessage) => {
                                if (giveawayMessage) {
                                    client.utils
                                        .endGiveaway(client, client.color, client.emoji, giveawayMessage, giveaway.autopay)
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
                        client.channels.cache
                            .get(giveaway.channelId)
                            ?.messages.fetch(giveaway.messageId)
                            .then((giveawayMessage) => {
                                if (giveawayMessage) {
                                    client.utils
                                        .endGiveawayShopItem(client, client.color, client.emoji, giveawayMessage, giveaway.autoAdd)
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

    cron.schedule(
        '01 18 * * *',
        () => {
            client.utils
                .createGiveaway(client)
                .then(() => console.log('Giveaway was create sucessfully.'))
                .catch((err) => console.error('Error in Giveaway function:', err));
        },
        {
            scheduled: true,
            timezone: 'Asia/Bangkok',
        }
    );

    cron.schedule(
        '01 19 * * *',
        () => {
            client.utils
                .checkBooster(client)
                .then(() => console.log('Booster/Sponsor check completed.'))
                .catch((err) => console.error('Error in Booster/Sponsor function:', err));
        },
        {
            scheduled: true,
            timezone: 'Asia/Bangkok',
        }
    );

    return await client.abilities.syncInvites(client);
});

client.on('guildMemberAdd', async (member) => {
    try {
        try {
            client.serverStatsManager?.scheduleUpdate(member.guild.id, 2000);
        } catch (err) {
            console.warn('Failed to schedule server stats update on member add:', err?.message || err);
        }
        await client.abilities.getWelcomeMessage(client, member);
    } catch (error) {
        console.error('Error in getWelcomeMessage:', error);
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.premiumSince === null && newMember.premiumSince !== null) {
        try {
            try {
                client.serverStatsManager?.scheduleUpdate(newMember.guild.id, 2000);
            } catch (err) {
                console.warn('Failed to schedule server stats update on member boost:', err?.message || err);
            }
            await client.abilities.getBoosterMessage(client, newMember);
        } catch (error) {
            console.error('Error in getBoosterMessage:', error);
        }
    }
});

client.on('guildMemberRemove', async (member) => {
    try {
        // Ensure server stats are updated when a member leaves or is kicked
        try {
            client.serverStatsManager?.scheduleUpdate(member.guild.id, 2000);
        } catch (err) {
            console.warn('Failed to schedule server stats update on member remove:', err?.message || err);
        }

        await client.abilities.getGoodByeMessage(client, member);
    } catch (error) {
        console.error('Error in getGoodByeMessage:', error);
    }
});

client.on('messageCreate', async (message) => {
    if (message.channel.type === ChannelType.DM) {
        if (message.author.bot) return;

        if (isKhmer(message.content)) {
            try {
                await message.channel.sendTyping();

                let recentMessages = [];

                if (hasPeachy(message.content)) {
                    // Get or create global conversation
                    let conversation = await ConversationSchema.findById('global');
                    if (!conversation) {
                        conversation = new ConversationSchema({
                            _id: 'global',
                            messages: [],
                        });
                    }

                    // Add user message to global history
                    conversation.messages.push({
                        userId: message.author.id,
                        content: message.content,
                        fromBot: false,
                    });

                    // Limit size to last 50
                    if (conversation.messages.length > 50) {
                        conversation.messages = conversation.messages.slice(-50);
                    }

                    await conversation.save();

                    // Get recent messages for context
                    recentMessages = conversation.messages.slice(-5).map((msg) => ({
                        role: msg.fromBot ? 'model' : 'user',
                        content: msg.content,
                    }));
                }

                const aiResponse = await client.utils.generateAIResponse(message.content, recentMessages);

                if (hasPeachy(message.content)) {
                    const conversation = await ConversationSchema.findById('global');
                    conversation.messages.push({
                        userId: 'bot',
                        content: aiResponse,
                        fromBot: true,
                    });

                    if (conversation.messages.length > 50) {
                        conversation.messages = conversation.messages.slice(-50);
                    }

                    await conversation.save();
                }

                return await message.author.send(aiResponse);
            } catch (error) {
                console.error(`AI error for ${message.author.tag}:`, error);
                return await message.author
                    .send('សូមអភ័យទោស មានបញ្ហាក្នុងការឆ្លើយតប។ សូមទាក់ទងមក server គាំទ្រសម្រាប់ជំនួយ។')
                    .catch((err) => console.error(`DM failed:`, err));
            }
        } else {
            return await message.author
                .send('សូមអភ័យទោស ខ្ញុំមិនអាចឆ្លើយតបជាភាសាអង់គ្លេសបានទេ។ សូមប្រើភាសាខ្មែរ។')
                .catch((error) => console.error(`Failed to send DM to ${message.author.tag}:`, error));
        }
    } else {
        if (message.attachments.size > 0 || !message.content.trim()) {
            return;
        }

        // Run automod checks on all messages
        await client.abilities.runAutomodChecks(client, message);

        // Check for custom prefix or global prefix
        const prefixCheck = await client.prefixManager.checkPrefix(message.content, message.author.id);

        if (prefixCheck.hasPrefix) {
            const channelId = message.channel.id;
            messageCount.set(channelId, (messageCount.get(channelId) || 0) + 1);
            if (messageCount.get(channelId) === 10) {
                const embed = client
                    .embed()
                    .setColor(client.color.main)
                    .setTitle('Surprise Drop!')
                    .setDescription('Claim your coins now!')
                    .addFields({
                        name: 'Lucky Coin',
                        value: `${client.utils.formatNumber(Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000)} ${client.emoji.coin}`,
                    });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('claim').setLabel('Claim').setEmoji('🎁').setStyle(ButtonStyle.Primary)
                );

                message.channel.send({ embeds: [embed], components: [row] });
                messageCount.set(channelId, 0); // Reset count
            }
        }

        if (message.content.startsWith('http') || message.content.startsWith('discord.gg')) {
            const antiLinkInfo = await AntiLinkSchema.findOne({
                guild: message.guild.id,
            });

            if (!antiLinkInfo) return;

            const memberPerms = antiLinkInfo.perms;

            const member = message.guild.members.cache.get(message.author.id);

            if (!member.permissions.has(memberPerms)) {
                try {
                    const sentMessage = await message.channel.send({
                        content: `${message.author}, you can't send links here`,
                    });
                    setTimeout(() => sentMessage.delete(), 3000);
                    await message.delete();
                } catch (error) {
                    console.error('Error handling anti-link message:', error);
                }
            }
        }

        await client.abilities.getAutoResponse(client, message);
    }
});

client.on('inviteCreate', async (invite) => await client.abilities.getInviteCreate(invite));

setInterval(async () => {
    try {
        const { connection } = require('mongoose');
        if ([1, 2, 99].includes(connection.readyState)) {
            return await client.abilities.getSendMessage(client);
        }
    } catch (error) {
        console.error('Error in getSendMessage interval:', error.message);
    }
}, 30000);

client.start(globalConfig.token);
