const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const moment = require('moment');
const WelcomeSchema = require('../schemas/welcomeMessages');
const SendMessageSchema = require('../schemas/sendMessage');
const AutomodSchema = require('../schemas/automod');
const AutoResponseSchema = require('../schemas/response');
const BoosterSchema = require('../schemas/boosterMessages');
const InviteSchema = require('../schemas/inviteTracker');
const InviteTrackerSchema = require('../schemas/inviteTrackerMessages');
const JoinRolesSchema = require('../schemas/joinRoles');
const GoodByeMessagesSchema = require('../schemas/goodByeMessages');
const LevelingMessagesSchema = require('../schemas/levelingMessage');
const globalConfig = require('../utils/Config');
const globalEmoji = require('../utils/Emoji');

// Register fonts with error handling
try {
    GlobalFonts.registerFromPath('./src/data/fonts/Ghibli.otf', 'Ghibli');
    GlobalFonts.registerFromPath('./src/data/fonts/Ghibli-Bold.otf', 'Ghibli-Bold');
} catch (error) {
    console.error('Failed to register fonts:', error);
}

module.exports = class Ability {
    static async syncInvites(client) {
        try {
            const allGuilds = client.guilds.cache;

            for (const [guildId, guild] of allGuilds) {
                try {
                    // Check if the guild has invite tracking enabled
                    const inviteTracker = await InviteTrackerSchema.findOne({
                        id: guild.id,
                        isActive: true,
                    });
                    if (!inviteTracker) continue; // Skip guilds without active invite tracking

                    // Fetch invites for the guild
                    const invites = await guild.invites.fetch();

                    // Sync invites to the database
                    await Promise.all(
                        invites.map(async (invite) => {
                            const data = {
                                guildId: guild.id,
                                guildName: guild.name,
                                inviteCode: invite.code,
                                uses: invite.uses,
                                userId: [],
                                inviterId: invite.inviter?.id || 'Unknown',
                                inviterTag: invite.inviter?.tag || 'Unknown',
                            };

                            await InviteSchema.updateOne(
                                { inviteCode: invite.code },
                                {
                                    $set: {
                                        guildId: guild.id,
                                        guildName: guild.name,
                                        inviterId: invite.inviter?.id || 'Unknown',
                                        inviterTag: invite.inviter?.tag || 'Unknown',
                                    },
                                    $max: { uses: invite.uses },
                                    $setOnInsert: { userId: [] },
                                },
                                { upsert: true }
                            );
                        })
                    );
                } catch (error) {
                    if (error.code === 50013) {
                        console.error(`Missing MANAGE_GUILD permission in guild ${guild.name} (${guild.id})`);
                        await InviteTrackerSchema.updateOne({ id: guild.id, isActive: true }, { $set: { isActive: false } });
                    } else {
                        console.error(`Error syncing invites for guild ${guild.name} (${guild.id}):`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error in syncInvites function:', error);
        }
    }

    static async getInviteCreate(invite) {
        const data = {
            guildId: invite.guild.id,
            guildName: invite.guild.name,
            inviteCode: invite.code,
            uses: invite.uses,
            userId: [],
            inviterId: invite.inviter?.id || 'Unknown',
            inviterTag: invite.inviter?.tag || 'Unknown',
        };

        try {
            await InviteSchema.updateOne({ inviteCode: invite.code }, { $set: data }, { upsert: true });
        } catch (error) {
            console.error(`Failed to sync created invite ${invite.code} for guild ${invite.guild.name} (${invite.guild.id}):`, error);
        }
    }

    static async getInviteDelete(invite) {
        try {
            await InviteSchema.deleteOne({ inviteCode: invite.code });
        } catch (error) {
            console.error(`Failed to delete invite ${invite.code} from DB for guild ${invite.guild.name} (${invite.guild.id}):`, error);
        }
    }

    static async getLevelingMessage(client, message, level) {
        try {
            const levelingMessage = await LevelingMessagesSchema.findOne({
                id: message.guild.id,
                isActive: true,
            });

            if (!levelingMessage) return;

            const { channel, content } = levelingMessage;
            const levelingChannel = message.member.guild.channels.cache.get(channel);

            if (!levelingChannel) {
                console.warn(`Leveling channel ${channel} not found in guild ${message.guild.name}. Disabling leveling message.`);
                await LevelingMessagesSchema.updateOne({ id: message.guild.id, isActive: true }, { $set: { isActive: false } });
                return;
            }

            let userInfo;
            try {
                userInfo = await client.utils.getUser(message.member.id);
            } catch (error) {
                console.error(`Failed to fetch user ${message.member.id}:`, error);
                userInfo = null;
            }

            if (!userInfo?.profile?.level) {
                console.warn(`No level data found for user ${message.member.id}`);
            }

            const processedContent = await Ability.resultMessage(
                client,
                message.member,
                message.guild,
                content,
                null,
                null,
                userInfo,
                level
            );

            await levelingChannel.send({
                content: processedContent || '',
            });
        } catch (error) {
            console.error(`Error processing leveling message for guild ${message.guild.name} (${message.guild.id}):`, error);
        }
    }

    static async getWelcomeMessage(client, member) {
        try {
            const welcomeMessage = await WelcomeSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            const joinRoles = await JoinRolesSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            const inviteTracker = await InviteTrackerSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });

            if (welcomeMessage) {
                const { channel, content, message, image, isEmbed, isCustomImage } = welcomeMessage;
                const welcomeChannel = member.guild.channels.cache.get(channel);

                if (!welcomeChannel) {
                    console.warn(`Welcome channel ${channel} not found in guild ${member.guild.name}. Disabling welcome message.`);
                    await WelcomeSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                    return;
                }

                if (isEmbed) {
                    const welcomeEmbed = await Ability.resultMessage(client, member, member.guild, message);
                    await welcomeChannel.send({
                        content: content
                            ? await Ability.replacePlaceholders(
                                  content,
                                  Ability.getReplacementData(member, member.guild, null, null, null, null)
                              )
                            : '',
                        embeds: welcomeEmbed ? [welcomeEmbed] : [],
                    });
                } else {
                    const files = isCustomImage
                        ? await Ability.getBackgroundCustom(client, member, image)
                        : await Ability.getBackgroundNormal(client, member, image);
                    await welcomeChannel.send({
                        content: content ? await Ability.resultMessage(client, member, member.guild, content) : '',
                        files: files ? [files] : [],
                    });
                }
            }

            if (joinRoles) {
                const { userRoles, botRoles } = joinRoles;
                const rolesToAssign = member.user.bot ? botRoles : userRoles;

                if (rolesToAssign) {
                    await Promise.all(
                        rolesToAssign.map(async (roleId) => {
                            const role = member.guild.roles.cache.get(roleId);
                            if (!role) {
                                console.warn(`Role with ID ${roleId} not found in guild ${member.guild.name}`);
                                return;
                            }
                            try {
                                await member.roles.add(role);
                            } catch (error) {
                                console.error(
                                    `Failed to assign role ${role.name} to ${member.user.tag} in guild ${member.guild.name}:`,
                                    error
                                );
                            }
                        })
                    );
                }
            }

            if (inviteTracker && globalConfig.guildId && member.guild.id === globalConfig.guildId) {
                try {
                    const { channel, content, message, image, isEmbed, isCustomImage } = inviteTracker;
                    const trackingChannel = member.guild.channels.cache.get(channel);

                    if (!trackingChannel) {
                        console.warn(
                            `Invite tracker channel ${channel} not found in guild ${member.guild.name}. Disabling invite tracker.`
                        );
                        await InviteTrackerSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                        return;
                    }

                    const currentInvites = await member.guild.invites.fetch();

                    for (const invite of currentInvites.values()) {
                        const previousInvite = await InviteSchema.findOne({
                            guildId: member.guild.id,
                            inviteCode: invite.code,
                        });

                        const previousUses = previousInvite ? previousInvite.uses : 0;

                        if (invite.uses > previousUses && invite.inviter) {
                            await InviteSchema.updateOne(
                                { guildId: member.guild.id, inviteCode: invite.code },
                                { $set: { uses: invite.uses, guildName: member.guild.name } },
                                { upsert: true }
                            );

                            const inviter = invite.inviter;
                            if (isEmbed) {
                                const trackerEmbed = await Ability.resultMessage(client, member, member.guild, message, invite, inviter);
                                await trackingChannel.send({
                                    content: content
                                        ? await Ability.resultMessage(client, member, member.guild, content, invite, inviter)
                                        : '',
                                    embeds: trackerEmbed ? [trackerEmbed] : [],
                                });
                            } else {
                                const files = isCustomImage
                                    ? await Ability.getBackgroundCustom(client, member, image)
                                    : await Ability.getBackgroundNormal(client, member, image);
                                await trackingChannel.send({
                                    content: content
                                        ? await Ability.resultMessage(client, member, member.guild, content, invite, inviter)
                                        : '',
                                    files: files ? [files] : [],
                                });
                            }

                            try {
                                const user = await client.utils.getUser(inviter.id);
                                if (!user) {
                                    console.error(`User not found in database: ${inviter.id}`);
                                    continue;
                                }
                                user.balance.coin += 300000;
                                await user.save();
                                await new Promise((resolve) => setTimeout(resolve, 2000));
                                const inviterMention = `<@${inviter.id}>`;
                                const giftEmbed = client
                                    .embed()
                                    .setColor(globalConfig.color.main)
                                    .setDescription(
                                        `# ${globalEmoji.giveaway.gift} GIFT FOR INVITER ${
                                            globalEmoji.giveaway.gift
                                        }\n${inviterMention} got reward **${client.utils.formatNumber(300000)}** ${
                                            globalEmoji.coin
                                        }\nThanks for inviting a new member to the server! We appreciate your help in growing our community!`
                                    )
                                    .setFooter({
                                        text: 'Enjoy your reward!',
                                        iconURL: client.utils.emojiToImage(globalEmoji.timestamp),
                                    })
                                    .setTimestamp();
                                await trackingChannel.send({ embeds: [giftEmbed] });
                            } catch (error) {
                                console.error(`Failed to process invite reward for ${inviter.id}:`, error);
                            }
                            break;
                        }
                    }

                    for (const invite of currentInvites.values()) {
                        await InviteSchema.updateOne(
                            { guildId: member.guild.id, inviteCode: invite.code },
                            { $set: { uses: invite.uses, guildName: member.guild.name } },
                            { upsert: true }
                        );
                    }
                } catch (error) {
                    console.error(`Failed to fetch or update invites for guild ${member.guild.name} (${member.guild.id}):`, error);
                    if (error.code === 50013) {
                        console.error('Missing Permissions: Ensure the bot has the Manage Server permission.');
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing welcome message for guild ${member.guild.name} (${member.guild.id}):`, error);
        }
    }

    static async getAutoResponse(client, message) {
        if (message.author.bot) return;
        try {
            const responseMessage = await AutoResponseSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });
            if (!responseMessage) return;
            const { autoresponse } = responseMessage;
            if (!autoresponse || autoresponse.length === 0) return;

            const matchingResponses = autoresponse.filter(
                (response) => response.trigger.trim().toLowerCase() === message.content.trim().toLowerCase()
            );

            if (!matchingResponses || matchingResponses.length === 0) return;

            const randomResponse = matchingResponses[Math.floor(Math.random() * matchingResponses.length)];
            if (!randomResponse?.response) return;

            let userInfo;
            try {
                userInfo = await client.utils.getUser(message.author.id);
            } catch (error) {
                console.error(`Failed to fetch user ${message.author.id}:`, error);
                userInfo = null;
            }

            const processedContent = await Ability.resultMessage(
                client,
                message.member,
                message.guild,
                randomResponse.response,
                null,
                null,
                userInfo,
                message.content
            );

            if (processedContent) {
                await message.reply(processedContent);
            } else {
                console.warn(`Failed to process response for trigger: ${message.content} in guild ${message.guild.name}`);
                await message.reply(randomResponse.response); // Fallback to raw response
            }
        } catch (error) {
            console.error(`Error processing auto-responses for guild ${message.guild.name} (${message.guild.id}):`, error);
        }
    }

    static async getBoosterMessage(client, member) {
        try {
            const boosterMessage = await BoosterSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            if (!boosterMessage) return;

            const { channel, content, message, image, isEmbed, isCustomImage } = boosterMessage;
            const boosterChannel = member.guild.channels.cache.get(channel);

            if (!boosterChannel) {
                console.warn(`Booster channel ${channel} not found in guild ${member.guild.name}. Disabling booster message.`);
                await BoosterSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                return;
            }

            if (isEmbed) {
                const boosterEmbed = await Ability.resultMessage(client, member, member.guild, message);
                await boosterChannel.send({
                    content: content
                        ? await Ability.replacePlaceholders(
                              content,
                              Ability.getReplacementData(member, member.guild, null, null, null, null)
                          )
                        : '',
                    embeds: boosterEmbed ? [boosterEmbed] : [],
                });
            } else {
                const files = isCustomImage
                    ? await Ability.getBackgroundCustom(client, member, image)
                    : await Ability.getBackgroundNormal(client, member, image);
                await boosterChannel.send({
                    content: content ? await Ability.resultMessage(client, member, member.guild, content) : '',
                    files: files ? [files] : [],
                });
            }
        } catch (error) {
            console.error(`Error processing booster message for guild ${member.guild.name} (${member.guild.id}):`, error);
        }
    }

    static async getGoodByeMessage(client, member) {
        try {
            const goodByeMessage = await GoodByeMessagesSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            if (!goodByeMessage) return;

            const { channel, content, message, image, isEmbed, isCustomImage } = goodByeMessage;
            const goodbyeChannel = member.guild.channels.cache.get(channel);

            if (!goodbyeChannel) {
                console.warn(`Goodbye channel ${channel} not found in guild ${member.guild.name}. Disabling goodbye message.`);
                await GoodByeMessagesSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                return;
            }
            if (isEmbed) {
                const goodByeEmbed = await Ability.resultMessage(client, member, member.guild, message);
                await goodbyeChannel.send({
                    content: content
                        ? await Ability.replacePlaceholders(
                              content,
                              Ability.getReplacementData(member, member.guild, null, null, null, null)
                          )
                        : '',
                    embeds: goodByeEmbed ? [goodByeEmbed] : [],
                });
            } else {
                const files = isCustomImage
                    ? await Ability.getBackgroundCustom(client, member, image)
                    : await Ability.getBackgroundNormal(client, member, image);
                await goodbyeChannel.send({
                    content: content ? await Ability.resultMessage(client, member, member.guild, content) : '',
                    files: files ? [files] : [],
                });
            }
        } catch (error) {
            console.error(`Error processing goodbye message for guild ${member.guild.name} (${member.guild.id}):`, error);
        }
    }

    static async getSendMessage(client) {
        try {
            // Check database connection status
            const { connection } = require('mongoose');
            if (![1, 2, 99].includes(connection.readyState)) {
                console.warn('[getSendMessage] Database connection not ready. Retrying on next interval.');
                return;
            }

            // Add timeout wrapper for the database operation
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database operation timeout after 5000ms')), 5000)
            );

            const sendMessage = await Promise.race([
                SendMessageSchema.findOneAndUpdate({ isActive: true }, { $set: { isActive: false } }, { new: true }),
                timeoutPromise,
            ]);

            if (!sendMessage) {
                return;
            }

            const { guild, userId, feature } = sendMessage;
            const server = client.guilds.cache.get(guild);
            if (!server) {
                console.warn(`Guild ${guild} not found for send message.`);
                return;
            }

            const member = server.members.cache.get(userId);
            if (!member) {
                console.warn(`Member ${userId} not found in guild ${server.name}.`);
                return;
            }

            await Ability.SendMessage(client, member, feature);
        } catch (error) {
            console.error('Error processing send message:', error.message);
        }
    }

    static async SendMessage(client, member, feature) {
        try {
            const welcomeMessage = await WelcomeSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            const boosterMessage = await BoosterSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            const inviteTracker = await InviteTrackerSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            const goodByeMessage = await GoodByeMessagesSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });
            const levelingMessage = await LevelingMessagesSchema.findOne({
                id: member.guild.id,
                isActive: true,
            });

            if (welcomeMessage && feature === 'welcome-message') {
                const { channel, content, message, image, isEmbed, isCustomImage } = welcomeMessage;
                const welcomeChannel = member.guild.channels.cache.get(channel);

                if (!welcomeChannel) {
                    console.warn(`Welcome channel ${channel} not found in guild ${member.guild.name}. Disabling welcome message.`);
                    await WelcomeSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                    return;
                }

                if (isEmbed) {
                    const welcomeEmbed = await Ability.resultMessage(client, member, member.guild, message);
                    await welcomeChannel.send({
                        content: content
                            ? await Ability.replacePlaceholders(
                                  content,
                                  Ability.getReplacementData(member, member.guild, null, null, null, null)
                              )
                            : '',
                        embeds: welcomeEmbed ? [welcomeEmbed] : [],
                    });
                } else {
                    const files = isCustomImage
                        ? await Ability.getBackgroundCustom(client, member, image)
                        : await Ability.getBackgroundNormal(client, member, image);
                    await welcomeChannel.send({
                        content: content ? await Ability.resultMessage(client, member, member.guild, content) : '',
                        files: files ? [files] : [],
                    });
                }
            }

            if (boosterMessage && feature === 'booster-message') {
                const { channel, content, message, image, isEmbed, isCustomImage } = boosterMessage;
                const boosterChannel = member.guild.channels.cache.get(channel);

                if (!boosterChannel) {
                    console.warn(`Booster channel ${channel} not found in guild ${member.guild.name}. Disabling booster message.`);
                    await BoosterSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                    return;
                }

                if (isEmbed) {
                    const boosterEmbed = await Ability.resultMessage(client, member, member.guild, message);
                    await boosterChannel.send({
                        content: content
                            ? await Ability.replacePlaceholders(
                                  content,
                                  Ability.getReplacementData(member, member.guild, null, null, null, null)
                              )
                            : '',
                        embeds: boosterEmbed ? [boosterEmbed] : [],
                    });
                } else {
                    const files = isCustomImage
                        ? await Ability.getBackgroundCustom(client, member, image)
                        : await Ability.getBackgroundNormal(client, member, image);
                    await boosterChannel.send({
                        content: content ? await Ability.resultMessage(client, member, member.guild, content) : '',
                        files: files ? [files] : [],
                    });
                }
            }

            if (inviteTracker && feature === 'invite-tracker-message') {
                try {
                    const { channel, content, message, image, isEmbed, isCustomImage } = inviteTracker;
                    const trackingChannel = member.guild.channels.cache.get(channel);

                    if (!trackingChannel) {
                        console.warn(
                            `Invite tracker channel ${channel} not found in guild ${member.guild.name}. Disabling invite tracker.`
                        );
                        await InviteTrackerSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                        return;
                    }

                    const currentInvites = await member.guild.invites.fetch();

                    for (const invite of currentInvites.values()) {
                        const previousInvite = await InviteSchema.findOne({
                            guildId: member.guild.id,
                            inviteCode: invite.code,
                        });

                        const previousUses = previousInvite ? previousInvite.uses : 0;

                        if (invite.uses > previousUses && invite.inviter) {
                            await InviteSchema.updateOne(
                                { guildId: member.guild.id, inviteCode: invite.code },
                                { $set: { uses: invite.uses, guildName: member.guild.name } },
                                { upsert: true }
                            );

                            const inviter = invite.inviter;
                            if (isEmbed) {
                                const trackerEmbed = await Ability.resultMessage(client, member, member.guild, message, invite, inviter);
                                await trackingChannel.send({
                                    content: content
                                        ? await Ability.resultMessage(client, member, member.guild, content, invite, inviter)
                                        : '',
                                    embeds: trackerEmbed ? [trackerEmbed] : [],
                                });
                            } else {
                                const files = isCustomImage
                                    ? await Ability.getBackgroundCustom(client, member, image)
                                    : await Ability.getBackgroundNormal(client, member, image);
                                await trackingChannel.send({
                                    content: content
                                        ? await Ability.resultMessage(client, member, member.guild, content, invite, inviter)
                                        : '',
                                    files: files ? [files] : [],
                                });
                            }
                            break;
                        }
                    }

                    for (const invite of currentInvites.values()) {
                        await InviteSchema.updateOne(
                            { guildId: member.guild.id, inviteCode: invite.code },
                            { $set: { uses: invite.uses, guildName: member.guild.name } },
                            { upsert: true }
                        );
                    }
                } catch (error) {
                    console.error(`Failed to fetch or update invites for guild ${member.guild.name} (${member.guild.id}):`, error);
                    if (error.code === 50013) {
                        console.error('Missing Permissions: Ensure the bot has the Manage Server permission.');
                    }
                }
            }

            if (goodByeMessage && feature === 'goodbye-message') {
                const { channel, content, message, image, isEmbed, isCustomImage } = goodByeMessage;
                const goodbyeChannel = member.guild.channels.cache.get(channel);

                if (!goodbyeChannel) {
                    console.warn(`Goodbye channel ${channel} not found in guild ${member.guild.name}. Disabling goodbye message.`);
                    await GoodByeMessagesSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                    return;
                }

                if (isEmbed) {
                    const goodByeEmbed = await Ability.resultMessage(client, member, member.guild, message);
                    await goodbyeChannel.send({
                        content: content ? await Ability.resultMessage(client, member, member.guild, content) : '',
                        embeds: goodByeEmbed ? [goodByeEmbed] : [],
                    });
                } else {
                    const files = isCustomImage
                        ? await Ability.getBackgroundCustom(client, member, image)
                        : await Ability.getBackgroundNormal(client, member, image);
                    await goodbyeChannel.send({
                        content: content ? await Ability.resultMessage(client, member, member.guild, content) : '',
                        files: files ? [files] : [],
                    });
                }
            }

            if (levelingMessage && feature === 'leveling-system') {
                const { channel, content } = levelingMessage;
                const levelingChannel = member.guild.channels.cache.get(channel);

                if (!levelingChannel) {
                    console.warn(`Leveling channel ${channel} not found in guild ${member.guild.name}. Disabling leveling message.`);
                    await LevelingMessagesSchema.updateOne({ id: member.guild.id, isActive: true }, { $set: { isActive: false } });
                    return;
                }

                let userInfo;
                try {
                    userInfo = await client.utils.getUser(member.id);
                } catch (error) {
                    console.error(`Failed to fetch user ${member.id}:`, error);
                    userInfo = null;
                }

                await levelingChannel.send({
                    content: content ? await Ability.resultMessage(client, member, member.guild, content, null, null, userInfo) : '',
                });
            }
        } catch (error) {
            console.error(`Error processing send message for guild ${member.guild.name} (${member.guild.id}):`, error);
        }
    }

    static replacePlaceholders(str, data) {
        if (!str || typeof str !== 'string') return str; // Return input if not a string
        return str.replace(/\${(.*?)}/g, (_, key) => data[key] || `\${${key}}`);
    }

    static getReplacementData(member, guild, invite, inviter, user, level) {
        const accountCreationDate = member.user?.createdAt ? moment(member.user.createdAt).fromNow() : 'Unknown';
        const guildTotalBoosts = guild?.premiumSubscriptionCount || 0;
        const guildBoostLevel = guild?.premiumTier || 0;
        const boostsMissingForNext = [2, 7, 14][guildBoostLevel] - guildTotalBoosts || 0;
        const nextBoostLevel = guildBoostLevel < 3 ? guildBoostLevel + 1 : 'Max';

        return {
            // User
            userid: member.id || 'Unknown',
            usertag: member.user?.tag || 'Unknown',
            username: member.user?.username || 'Unknown',
            userglobalnickname: member.user?.globalName || 'Unknown',
            usermention: member.id ? `<@${member.id}>` : 'Unknown',
            useravatarurl: member.user?.displayAvatarURL() || 'N/A',
            userserveravatarurl: member.displayAvatarURL() || 'N/A',
            usernickname: member.nickname || 'None',
            userdisplayname: member.displayName || 'Unknown',
            usercreatedat: accountCreationDate,
            usercreatedtimestamp: member.user?.createdTimestamp || 0,
            userjoinedat: member.joinedAt?.toLocaleString() || 'Unknown',
            userjoinedtimestamp: member.joinedTimestamp || 0,

            // Guild
            guildid: guild?.id || 'Unknown',
            guildname: guild?.name || 'Unknown',
            guildiconurl: guild?.iconURL() || 'N/A',
            guildbannerurl: guild?.bannerURL() || 'N/A',
            guildmembercount: guild?.memberCount || 0,
            guildvanitycode: guild?.vanityURLCode || 'N/A',

            // Boost
            guildtotalboosts: guildTotalBoosts,
            guildboostlevel: guildBoostLevel,
            guildboostsmissingfornext: boostsMissingForNext >= 0 ? boostsMissingForNext : 0,
            guildboostnextlevel: nextBoostLevel,

            // Invite
            invitecode: invite?.code || 'N/A',
            inviteurl: invite ? `https://discord.gg/${invite.code}` : 'N/A',
            invitechannel: invite?.channel?.name || 'N/A',
            inviteuses: invite?.uses || 0,

            // Inviter
            inviterid: inviter?.id || 'Unknown',
            invitertag: inviter?.tag || 'Unknown',
            invitername: inviter?.username || 'Unknown',
            invitermention: inviter?.id ? `<@${inviter.id}>` : 'N/A',
            inviteravatarurl: inviter?.displayAvatarURL() || 'N/A',
            invitertotalinvites: inviter?.totalInvites || 0,
            inviterfakeinvites: inviter?.fakeInvites || 0,
            inviterleftinvites: inviter?.leftInvites || 0,
            inviterjoinedinvites: inviter?.joinedInvites || 0,
            inviterbonusinvites: inviter?.bonusInvites || 0,

            // Level
            oldLevel: user?.profile?.level - 1 || 0,
            currentLevel: user?.profile?.level || 1,
            nextLevel: user?.profile?.level + 1 || 0,
            currentXP: user?.profile?.xp || 0,
            requiredXP: user?.profile?.levelXp || 0,
            xpGained: user?.profile?.lastXpGain || 0,
        };
    }

    static async resultMessage(client, member, guild, result, invite, inviter, userInfo, level) {
        const data = Ability.getReplacementData(member, guild, invite, inviter, userInfo, level);

        if (typeof result !== 'object') {
            return Ability.replacePlaceholders(result, data);
        } else {
            const embed = client.embed().setColor(result.message?.color || '#F582AE');

            if (result.message?.title) {
                embed.setTitle(Ability.replacePlaceholders(result.message.title, data));
            }

            if (result.message?.description) {
                embed.setDescription(Ability.replacePlaceholders(result.message.description, data));
            }

            if (result.message?.thumbnail) {
                embed.setThumbnail(Ability.replacePlaceholders(result.message.thumbnail, data));
            }

            if (result.message?.image) {
                embed.setImage(Ability.replacePlaceholders(result.message.image, data));
            }

            if (result.message?.footer) {
                const footerText = result.message.footer.text ? Ability.replacePlaceholders(result.message.footer.text, data) : null;
                const footerIconURL = result.message.footer.iconURL
                    ? Ability.replacePlaceholders(result.message.footer.iconURL, data)
                    : null;

                if (footerText || footerIconURL) {
                    embed.setFooter({ text: footerText, iconURL: footerIconURL });
                }
            }

            if (result.message?.fields && result.message.fields.length > 0) {
                result.message.fields.forEach((field) => {
                    if (field.name && field.value) {
                        embed.addFields({
                            name: Ability.replacePlaceholders(field.name, data),
                            value: Ability.replacePlaceholders(field.value, data),
                            inline: field.inline ?? false,
                        });
                    }
                });
            }

            embed.setTimestamp();
            return embed;
        }
    }

    static async getBackgroundNormal(client, member, data) {
        return data.backgroundImage || 'https://ik.imagekit.io/yuuslokrobjakkroval/PEACHY%20BOT/Banner.gif';
    }

    static async getBackgroundCustom(client, member, data) {
        const width = 800;
        const height = 450;
        const defaultBackgroundUrl = 'https://ik.imagekit.io/yuuslokrobjakkroval/PEACHY%20BOT/Banner.gif';
        const fallbackBackgroundColor = '#DFF2EB';

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        try {
            // Use the new safe image loading utility
            const result = await client.utils.safeLoadImage(data.backgroundImage, defaultBackgroundUrl, fallbackBackgroundColor);

            if (result.image) {
                ctx.drawImage(result.image, 0, 0, width, height);
                if (result.usedFallback) {
                    console.warn('Used fallback image due to:', result.error);
                }
            } else {
                // If all image loading fails, use a solid color background
                ctx.fillStyle = fallbackBackgroundColor;
                ctx.fillRect(0, 0, width, height);
            }
        } catch (error) {
            console.error('Unexpected error in background loading:', error);
            // Final fallback - solid color background
            ctx.fillStyle = fallbackBackgroundColor;
            ctx.fillRect(0, 0, width, height);
        }

        try {
            const avatar = await loadImage(member.displayAvatarURL({ format: 'png', size: 256 }));
            const userAvatarSize = 128;
            const userAvatarX = width / 2 - userAvatarSize / 2;
            const userAvatarY = 100;

            ctx.textAlign = 'center';

            ctx.shadowColor = 'rgba(0, 0, 0, 1)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.font = '72px Ghibli-Bold, Arial';
            ctx.fillStyle = data.featureColor || '#FFFFFF';
            ctx.fillText(data.feature || 'Welcome', width / 2, 300);

            ctx.font = '32px Ghibli-Bold, Arial';
            ctx.fillStyle = data.usernameColor || '#FFFFFF';
            ctx.fillText(client.utils.formatUpperCase(member.user?.username || 'Unknown'), width / 2, 340);

            ctx.font = '28px Ghibli-Bold, Arial';
            ctx.fillStyle = data.messageColor || '#FFFFFF';
            ctx.fillText(data.message || '', width / 2, 380);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            if (data.avatarShape === 'Square') {
                const borderRadius = 16;
                ctx.beginPath();
                ctx.moveTo(userAvatarX + borderRadius, userAvatarY);
                ctx.lineTo(userAvatarX + userAvatarSize - borderRadius, userAvatarY);
                ctx.arcTo(
                    userAvatarX + userAvatarSize,
                    userAvatarY,
                    userAvatarX + userAvatarSize,
                    userAvatarY + borderRadius,
                    borderRadius
                );
                ctx.lineTo(userAvatarX + userAvatarSize, userAvatarY + userAvatarSize - borderRadius);
                ctx.arcTo(
                    userAvatarX + userAvatarSize,
                    userAvatarY + userAvatarSize,
                    userAvatarX + userAvatarSize - borderRadius,
                    userAvatarY + userAvatarSize,
                    borderRadius
                );
                ctx.lineTo(userAvatarX + borderRadius, userAvatarY + userAvatarSize);
                ctx.arcTo(
                    userAvatarX,
                    userAvatarY + userAvatarSize,
                    userAvatarX,
                    userAvatarY + userAvatarSize - borderRadius,
                    borderRadius
                );
                ctx.lineTo(userAvatarX, userAvatarY + borderRadius);
                ctx.arcTo(userAvatarX, userAvatarY, userAvatarX + borderRadius, userAvatarY, borderRadius);
                ctx.closePath();

                ctx.lineWidth = 8;
                ctx.strokeStyle = data.circleColor || '#FFFFFF';
                ctx.stroke();

                ctx.clip();
                ctx.drawImage(avatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
            } else {
                ctx.beginPath();
                ctx.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2 + 2, 0, Math.PI * 2, true);

                ctx.lineWidth = 8;
                ctx.strokeStyle = data.circleColor || '#FFFFFF';
                ctx.stroke();
                ctx.clip();
                ctx.drawImage(avatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
            }
        } catch (error) {
            console.error(`Error processing avatar or text for member ${member.user.id}:`, error);
        }

        return new AttachmentBuilder(canvas.toBuffer('image/png'), {
            name: `${data.feature || 'image'}.png`,
        });
    }

    // ============== AUTOMOD METHODS ==============

    /**
     * Check if user is whitelisted for automod
     */
    static isWhitelisted(automodConfig, userId) {
        if (!automodConfig || !automodConfig.whitelistedUsersRoles) return false;
        return automodConfig.whitelistedUsersRoles.includes(userId);
    }

    /**
     * Check if channel is an exception channel
     */
    static isExceptionChannel(automodConfig, channelId) {
        return automodConfig?.exceptionChannels && automodConfig.exceptionChannels.includes(channelId);
    }

    /**
     * Detect and handle bad words
     */
    static async checkBadWords(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiBadwords) return;
            if (!automodConfig.badWordsList || automodConfig.badWordsList.length === 0) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const contentLower = message.content.toLowerCase();
            let foundBadWord = null;

            for (const word of automodConfig.badWordsList) {
                const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'gi');
                if (regex.test(contentLower)) {
                    foundBadWord = word;
                    break;
                }
            }

            if (foundBadWord && (!automodConfig.badWordsWhitelist || !automodConfig.badWordsWhitelist.includes(foundBadWord))) {
                await message.delete().catch(() => {});
                console.log(`[AUTOMOD] Bad word detected: "${foundBadWord}" from ${message.author.tag} in ${message.guild.name}`);
            }
        } catch (error) {
            console.error('Error checking bad words:', error);
        }
    }

    /**
     * Detect and handle anti-spam
     */
    static async checkAntiSpam(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiSpam) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const userKey = `${message.guild.id}-${message.author.id}-spam`;
            if (!global.spamCache) global.spamCache = {};

            if (!global.spamCache[userKey]) {
                global.spamCache[userKey] = [];
            }

            const now = Date.now();
            global.spamCache[userKey].push(now);
            global.spamCache[userKey] = global.spamCache[userKey].filter((timestamp) => now - timestamp < 5000);

            if (global.spamCache[userKey].length > 5) {
                await message.delete().catch(() => {});
                console.log(`[AUTOMOD] Spam detected from ${message.author.tag} in ${message.guild.name}`);
                delete global.spamCache[userKey];
            }
        } catch (error) {
            console.error('Error checking anti-spam:', error);
        }
    }

    /**
     * Detect and handle anti-link
     */
    static async checkAntiLink(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiLinks) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const urlRegex = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
            const urls = message.content.match(urlRegex) || [];

            if (urls.length > 0) {
                await message.delete().catch(() => {});
                console.log(`[AUTOMOD] Link detected from ${message.author.tag} in ${message.guild.name}`);
            }
        } catch (error) {
            console.error('Error checking anti-link:', error);
        }
    }

    /**
     * Detect and handle anti-mention spam
     */
    static async checkAntiMentionSpam(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiMentionSpam) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const mentionCount = message.mentions.size;
            const mentionLimit = 5;

            if (mentionCount > mentionLimit) {
                await message.delete().catch(() => {});
                console.log(
                    `[AUTOMOD] Mention spam detected from ${message.author.tag} in ${message.guild.name} (${mentionCount} mentions)`
                );
            }
        } catch (error) {
            console.error('Error checking anti-mention spam:', error);
        }
    }

    /**
     * Detect and handle anti-caps
     */
    static async checkAntiCaps(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiAllCaps) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const textOnly = message.content.replace(/[^a-zA-Z]/g, '');

            if (textOnly.length < 5) return;

            const capsCount = (message.content.match(/[A-Z]/g) || []).length;
            const capsPercent = (capsCount / textOnly.length) * 100;

            if (capsPercent > 70) {
                await message.delete().catch(() => {});
                console.log(
                    `[AUTOMOD] Excessive caps detected from ${message.author.tag} in ${message.guild.name} (${capsPercent.toFixed(1)}%)`
                );
            }
        } catch (error) {
            console.error('Error checking anti-caps:', error);
        }
    }

    /**
     * Detect and handle anti-emoji spam
     */
    static async checkAntiEmojiSpam(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiEmojiSpam) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
            const emojiCount = (message.content.match(emojiRegex) || []).length;
            const emojiLimit = 10;

            if (emojiCount > emojiLimit) {
                await message.delete().catch(() => {});
                console.log(`[AUTOMOD] Emoji spam detected from ${message.author.tag} in ${message.guild.name} (${emojiCount} emojis)`);
            }
        } catch (error) {
            console.error('Error checking anti-emoji spam:', error);
        }
    }

    /**
     * Detect and handle anti-zalgo
     */
    static async checkAntiZalgo(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiZalgo) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const zalgoRegex = /[\u0300-\u036f]{3,}/g;

            if (zalgoRegex.test(message.content)) {
                await message.delete().catch(() => {});
                console.log(`[AUTOMOD] Zalgo text detected from ${message.author.tag} in ${message.guild.name}`);
            }
        } catch (error) {
            console.error('Error checking anti-zalgo:', error);
        }
    }

    /**
     * Detect and handle anti-invite
     */
    static async checkAntiInvite(client, message) {
        try {
            if (message.author.bot) return;

            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });

            if (!automodConfig?.antiInvites) return;

            if (Ability.isWhitelisted(automodConfig, message.author.id)) return;
            if (Ability.isExceptionChannel(automodConfig, message.channel.id)) return;

            const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|com)|discordapp\.com\/invite)\/([a-z0-9-_]+)/gi;
            const invites = message.content.match(inviteRegex) || [];

            if (invites.length > 0) {
                await message.delete().catch(() => {});
                console.log(`[AUTOMOD] Discord invite detected from ${message.author.tag} in ${message.guild.name}`);
            }
        } catch (error) {
            console.error('Error checking anti-invite:', error);
        }
    }

    /**
     * Main automod check function to run all checks
     */
    static async runAutomodChecks(client, message) {
        try {
            if (!message.guild || message.author.bot) return;
            const automodConfig = await AutomodSchema.findOne({
                guildId: message.guild.id,
                isActive: true,
            });
            if (!automodConfig) return;
            await Promise.all([
                Ability.checkBadWords(client, message),
                Ability.checkAntiSpam(client, message),
                Ability.checkAntiLink(client, message),
                Ability.checkAntiMentionSpam(client, message),
                Ability.checkAntiCaps(client, message),
                Ability.checkAntiEmojiSpam(client, message),
                Ability.checkAntiZalgo(client, message),
                Ability.checkAntiInvite(client, message),
            ]);
        } catch (error) {
            console.error('Error running automod checks:', error);
        }
    }
};
