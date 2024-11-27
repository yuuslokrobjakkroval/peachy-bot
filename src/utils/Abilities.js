const { ActionRowBuilder, ButtonBuilder, CommandInteraction, EmbedBuilder, Permissions, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const Users = require('../schemas/user');
const WelcomeSchema = require("../schemas/welcomeMessages");
const SendMessageSchema = require("../schemas/sendMessage");
const AutoResponseSchema = require("../schemas/response");
const InviteSchema = require("../schemas/inviteTracker");
const InviteTrackerSchema = require("../schemas/inviteTrackerMessages");
const JoinRolesSchema = require("../schemas/joinRoles");
const GoodByeMessagesSchema = require("../schemas/goodByeMessages");
const UserVoteSchema = require("../schemas/userVote");
const moment = require("moment");
const chance = require('chance').Chance();

GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-Roman.otf', 'Kelvinch-Roman');
GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-Bold.otf', 'Kelvinch-Bold');
GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-BoldItalic.otf', 'Kelvinch-SemiBoldItalic');

module.exports = class Ability {
    static async syncInvites(client) {
        const allGuilds = client.guilds.cache;
        for (const [guildId, guild] of allGuilds) {
            try {
                const invites = await guild.invites.fetch();

                for (const invite of invites.values()) {
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
                        { $set: data },
                        { upsert: true }
                    );
                }
            } catch (error) {
                if (error.code === 50013) {
                    continue;
                }
                continue;
            }
        }
    }

    static async getInviteCreate(invite) {
        const data = {
            guildId: invite.guild.id,
            guildName: invite.guild.name,
            inviteCode: invite.code,
            uses: invite.uses,
            userId: [], // Populate as needed
            inviterId: invite.inviter?.id || 'Unknown',
            inviterTag: invite.inviter?.tag || 'Unknown',
        };

        try {
            await InviteSchema.updateOne(
                { inviteCode: invite.code },
                { $set: data },
                { upsert: true }
            );
        } catch (error) {
            console.error(`Failed to sync created invite: ${invite.code}`, error);
        }
    }

    static async getInviteDelete(invite) {
        try {
            await InviteSchema.deleteOne({ inviteCode: invite.code });
        } catch (error) {
            console.error(`Failed to delete invite from DB: ${invite.code}`, error);
        }
    }

    static async getSendMessage(client) {
        try {
            const sendMessage = await SendMessageSchema.findOne({ isActive: true });
            if (!sendMessage) {
                return
            }
            sendMessage.isActive = false;
            await sendMessage.save();
            const { guild, userId, feature } = sendMessage;
            let server = client.guilds.cache.get(guild);
            if (!server) {
                return;
            }

            const member = server.members.cache.get(userId);
            if (!member) {
                return;
            }

            switch (feature) {
                case 'welcome-message':
                    await client.abilities.getWelcomeMessage(client, member);
                    break;
                case 'goodbye-message':
                    await client.abilities.getGoodByeMessage(client, member);
                    break;
                default:
                    return;
            }


        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    static async getWelcomeMessage(client, member) {
        try {
            const welcomeMessage = await WelcomeSchema.findOne({ id: member.guild.id, isActive: true });
            const joinRoles = await JoinRolesSchema.findOne({ id: member.guild.id, isActive: true });
            const inviteTracker = await InviteTrackerSchema.findOne({ id: member.guild.id, isActive: true });

            if (welcomeMessage) {
                const { channel, content, message, image, isEmbed } = welcomeMessage;
                const welcomeChannel = member.guild.channels.cache.get(channel);

                if (!welcomeChannel) {
                    console.warn(`Welcome channel ${channel} not found in guild ${member.guild.name}.`);
                    return;
                }

                if (welcomeChannel) {
                    if (isEmbed) {
                        const welcomeEmbed = await client.abilities.resultMessage(client, member, member.guild, message);
                        welcomeChannel.send({
                            content: content ? await client.abilities.replacePlaceholders(client.abilities.getReplacementData(member, member.guild, content)) : '',
                            embeds: welcomeEmbed ? [welcomeEmbed] : []
                        });
                    } else {
                        const files = await client.abilities.getBackgroundImage(client, member, image);
                        welcomeChannel.send({ content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '', files: files ? [files] : [] });
                    }
                }
            }

            if (joinRoles) {
                const { userRoles, botRoles } = joinRoles;
                const rolesToAssign = member.user.bot ? botRoles : userRoles;

                if(!rolesToAssign) {
                    return;
                }

                await Promise.all(
                    rolesToAssign.map(async (roleId) => {
                        const role = member.guild.roles.cache.get(roleId);

                        if(!role) {
                            console.warn(`Role with ID ${roleId} not found in guild ${member.guild.name}`);
                            return;
                        }

                        if (role)  {
                            try {
                                await member.roles.add(role);
                            } catch (error) {
                                console.error(
                                    `Failed to assign role ${role.name} to ${member.user.tag} in guild ${member.guild.name}:`,
                                    error
                                );
                            }
                        } else {
                            console.warn(`Role with ID ${roleId} not found in guild ${member.guild.name}`);
                        }
                    })
                );
            }

            if (inviteTracker) {
                try {
                    const { channel, content, message, image, isEmbed } = inviteTracker;
                    const currentInvites = await member.guild.invites.fetch();

                    for (const invite of currentInvites.values()) {
                        const previousInvite = await InviteSchema.findOne({ guildId: member.guild.id, inviteCode: invite.code });

                        const previousUses = previousInvite ? previousInvite.uses : 0;

                        if (invite.uses > previousUses) {
                            await InviteSchema.updateOne(
                                { guildId: member.guild.id, inviteCode: invite.code },
                                { $set: { uses: invite.uses, guildName: member.guild.name } },
                                { upsert: true }
                            );

                            const inviter = invite.inviter;
                            const trackingChannel = member.guild.channels.cache.get(channel);
                            if (trackingChannel) {
                                if (isEmbed) {
                                    const trackerEmbed = await client.abilities.resultMessage(client, member, member.guild, message, invite, inviter);
                                    trackingChannel.send({
                                        content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '',
                                        embeds: trackerEmbed ? [trackerEmbed] : [],
                                    });
                                } else {
                                    const files = await client.abilities.getBackgroundImage(client, member, image);
                                    trackingChannel.send({
                                        content: content ? await client.abilities.resultMessage(client, member, member.guild, content, invite, inviter) : '',
                                        files: files ? [files] : [],
                                    });
                                }
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
                    console.error(`Failed to fetch or update invites for guild ${member.guild.name}:`, error);
                    if (error.code === 50013) {
                        console.error('Missing Permissions: Ensure the bot has the Manage Server permission.');
                    }
                }
            }

        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    static async getAutoResponse(client, message) {
        if (message.author.bot) return;
        try {
            const responseMessage = await AutoResponseSchema.findOne({ guildId: message.guild.id, isActive: true });
            if (!responseMessage) return;
            const { autoresponse } = responseMessage;
            if (!autoresponse || autoresponse.length === 0) return;

            const matchingResponses = autoresponse.filter(response =>
                message.content.toLowerCase() === response.trigger.toLowerCase()
            );

            if (!matchingResponses) return;

            if (matchingResponses.length > 0) {
                const randomResponse = matchingResponses[Math.floor(Math.random() * matchingResponses.length)];
                if (randomResponse?.response) {
                    await message.reply(randomResponse.response);
                } else {
                    console.warn(`No valid response found for trigger: ${message.content}`);
                }
            }
        } catch (error) {
            console.error(`Error processing auto-responses for guild ${message.guild.id}:`, error);
        }
    }

    static async getGoodByeMessage(client, member) {
        try {
            const goodByeMessage = await GoodByeMessagesSchema.findOne({ id: member.guild.id, isActive: true });

            if (goodByeMessage) {
                const { channel, content, message, image, isEmbed } = goodByeMessage;
                const goodbyeChannel = member.guild.channels.cache.get(channel);

                if (goodbyeChannel){
                    if(isEmbed) {
                        const goodByeEmbed = await client.abilities.resultMessage(client, member, member.guild, message);
                        goodbyeChannel.send({
                            content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '',
                            embeds: goodByeEmbed ? [goodByeEmbed] : []
                        });
                    } else {
                        const files = await client.abilities.getBackgroundImage(client, member, image);
                        goodbyeChannel.send({ content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '', files: files ? [files] : [] });
                    }
                }
            }
        } catch (error) {
            console.error('Error processing goodbye message:', error);
        }
    }

    static replacePlaceholders(str, data) {
        if (!str || typeof str !== "string") return str; // Return the input if it's not a string
        return str.replace(/\${(.*?)}/g, (_, key) => data[key] || `\${${key}}`); // Replace placeholders with data values
    }

    static getReplacementData(member, guild, invite, inviter) {
        const accountCreationDate = moment(member.user.createdAt).fromNow();
        return {
            // User Data
            userid: member.id,
            usertag: member.user.tag,
            username: member.user.username,
            userglobalnickname: member.user.globalName,
            usermention: `<@${member.id}>`,
            useravatarurl: member.user.displayAvatarURL(),
            userserveravatarurl: member.displayAvatarURL(),
            usernickname: member.nickname,
            userdisplayname: member.displayName,
            usercreatedat: accountCreationDate,
            usercreatedtimestamp: member.user.createdTimestamp,
            userjoinedat: member.joinedAt?.toLocaleString(),
            userjoinedtimestamp: member.joinedTimestamp,

            // Guild Data
            guildid: guild.id,
            guildname: guild.name,
            guildiconurl: guild.iconURL(),
            guildbannerurl: guild.bannerURL(),
            guildmembercount: guild.memberCount,
            guildvanitycode: guild.vanityURLCode,

            // Invite Data
            invitecode: invite?.code || "N/A",
            inviteurl: invite ? `https://discord.gg/${invite.code}` : "N/A",
            invitechannel: invite?.channel?.name || "N/A",
            inviteuses: invite?.uses || 0,

            // Inviter Data
            inviterid: inviter?.id || "Unknown",
            invitertag: inviter?.tag || "Unknown",
            invitername: inviter?.username || "Unknown",
            invitermention: inviter ? `<@${inviter.id}>` : "N/A",
            inviteravatarurl: inviter?.displayAvatarURL() || "N/A",
            invitertotalinvites: inviter?.totalInvites || 0,
            inviterfakeinvites: inviter?.fakeInvites || 0,
            inviterleftinvites: inviter?.leftInvites || 0,
            inviterjoinedinvites: inviter?.joinedInvites || 0,
            inviterbonusinvites: inviter?.bonusInvites || 0,
        };
    }

    static async resultMessage(client, member, guild, result, invite, inviter) {
        const data = client.abilities.getReplacementData(member, guild, invite, inviter);

        if (typeof result !== "object") {
            return client.abilities.replacePlaceholders(result, data);
        } else {

            const embed = client.embed().setColor(result.message?.color || '#F582AE'); // Set default color

            // Only set title if it's not null or empty
            if (result.message?.title) {
                embed.setTitle(client.abilities.replacePlaceholders(result.message.title, data));
            }

            // Only set description if it's not null or empty
            if (result.message?.description) {
                embed.setDescription(client.abilities.replacePlaceholders(result.message.description, data));
            }

            // Only set thumbnail if it's not null or empty
            if (result.message?.thumbnail) {
                embed.setThumbnail(client.abilities.replacePlaceholders(result.message.thumbnail, data));
            }

            // Only set image if it's not null or empty
            if (result.message?.image) {
                embed.setImage(client.abilities.replacePlaceholders(result.message.image, data));
            }

            // Only set footer if there's footer text or iconURL
            if (result.message?.footer) {
                const footerText = client.abilities.replacePlaceholders(result.message.footer.text, data);
                const footerIconURL = client.abilities.replacePlaceholders(result.message.footer.iconURL, data);

                if (footerText || footerIconURL) { // Only set if there is valid content
                    embed.setFooter(footerText, footerIconURL);
                }
            }

            // Add fields if they exist and are not empty
            if (result.message?.fields && result.message.fields.length > 0) {
                result.message.fields.forEach(field => {
                    if (field.name && field.value) { // Ensure both name and value are not null, undefined or empty
                        embed.addFields({
                            name: client.abilities.replacePlaceholders(field.name, data),
                            value: client.abilities.replacePlaceholders(field.value, data),
                            inline: field.inline ?? false // Default to false if inline is not defined
                        });
                    }
                });
            }

            // Set timestamp
            embed.setTimestamp();

            return embed;
        }
    }

    static async getBackgroundImage(client, member, data) {
        const width = 800; // Set canvas width
        const height = 450; // Set canvas height

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        let background
        if (data.backgroundImage) {
            background = await loadImage(data.backgroundImage);
            ctx.drawImage(background, 0, 0, width, height);
        } else {
            ctx.fillStyle = '#DFF2EB';
            ctx.fillRect(0, 0, width, height);
        }

        const avatar = await loadImage(member.displayAvatarURL({ format: 'png', size: 256 }));
        const userAvatarSize = 128;
        const userAvatarX = width / 2 - userAvatarSize / 2;
        const userAvatarY = 100;

        ctx.textAlign = 'center';

        // Apply shadow for text
        ctx.shadowColor = 'rgba(0, 0, 0, 1)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // FEATURE Text
        ctx.font = 'Bold 72px Kelvinch-Bold, Arial';
        ctx.fillStyle = data.featureColor;
        ctx.fillText(data.feature, width / 2, 300);

        // Username
        ctx.font = '32px Kelvinch-Bold, Arial';
        ctx.fillStyle = data.usernameColor;
        ctx.fillText(client.utils.formatUpperCase(member.user.username), width / 2, 340);

        // Message
        ctx.font = '28px Kelvinch-Bold, Arial';
        ctx.fillStyle = data.messageColor;
        ctx.fillText(data.message, width / 2, 380);

        // Reset shadow settings
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (data.avatarShape === 'Square') {
            const borderRadius = 16;
            ctx.beginPath();
            ctx.moveTo(userAvatarX + borderRadius, userAvatarY);
            ctx.lineTo(userAvatarX + userAvatarSize - borderRadius, userAvatarY);
            ctx.arcTo(userAvatarX + userAvatarSize, userAvatarY, userAvatarX + userAvatarSize, userAvatarY + borderRadius, borderRadius);
            ctx.lineTo(userAvatarX + userAvatarSize, userAvatarY + userAvatarSize - borderRadius);
            ctx.arcTo(userAvatarX + userAvatarSize, userAvatarY + userAvatarSize, userAvatarX + userAvatarSize - borderRadius, userAvatarY + userAvatarSize, borderRadius);
            ctx.lineTo(userAvatarX + borderRadius, userAvatarY + userAvatarSize);
            ctx.arcTo(userAvatarX, userAvatarY + userAvatarSize, userAvatarX, userAvatarY + userAvatarSize - borderRadius, borderRadius);
            ctx.lineTo(userAvatarX, userAvatarY + borderRadius);
            ctx.arcTo(userAvatarX, userAvatarY, userAvatarX + borderRadius, userAvatarY, borderRadius);
            ctx.closePath();

            ctx.lineWidth = 8;
            ctx.strokeStyle = data.circleColor;
            ctx.stroke();

            ctx.clip();
            ctx.drawImage(avatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
        } else {
            ctx.beginPath();
            ctx.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2 + 2, 0, Math.PI * 2, true); // Slightly larger circle

            ctx.lineWidth = 8;
            ctx.strokeStyle = data.circleColor;
            ctx.stroke();
            ctx.clip();
            ctx.drawImage(avatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
        }

        return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: `${data.feature}.png` });
    }

    static async getReward(client) {
        try {
            const reward = await UserVoteSchema.findOne({ rewarded: false });
            if (!reward) {
                return;
            }

            const { userId } = reward;

            const voteChannel = await client.channels.fetch(client.config.channel.reward);
            if (!voteChannel) {
                console.warn("Reward channel not found.");
                return;
            }

            const userInfo = await client.users.fetch(userId);

            let user = await Users.findOne({ userId });
            if (!user) {
                user = new Users({
                    userId,
                    balance: { coin: 0, bank: 0 },
                    'profile.xp': 0,
                });
                await user.save();
                console.log(`New user created for ${userId}`);
            }

            user.balance = user.balance || { coin: 0, bank: 0 };
            user.profile = user.profile || { xp: 0 };

            const baseCoins = chance.integer({ min: 25000, max: 50000 });
            const baseExp = chance.integer({ min: 50, max: 75 });

            const isVerified = user.verification?.verify?.status === 'verified';
            const bonusCoins = isVerified ? Math.floor(baseCoins * 0.4) : 0;
            const bonusExp = isVerified ? Math.floor(baseExp * 0.4) : 0;

            const totalCoins = baseCoins + bonusCoins;
            const totalExp = baseExp + bonusExp;

            user.balance.coin += totalCoins;
            user.profile.xp += totalExp;
            await user.save();

            reward.rewarded = true;
            await reward.save();

            const bonusMessage =
                bonusCoins > 0 || bonusExp > 0
                    ? `\n**+40% Bonus**\n${client.emoji.coin}: **+${client.utils.formatNumber(bonusCoins)}** coins\n${client.emoji.exp}: **+${client.utils.formatNumber(bonusExp)}** xp`
                    : '';

            const embed = client.embed()
                .setColor(client.color.main)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription(
                    `You have received **+${client.utils.formatNumber(baseCoins)}** ${client.emoji.coin} and **${client.utils.formatNumber(baseExp)}** ${client.emoji.exp} for voting!${bonusMessage}`
                )
                .setFooter({
                    text: `reward for ${userInfo.displayName}`,
                    iconURL: userInfo.displayAvatarURL()
                })

            await voteChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error(`Error getting reward for vote: ${error.message}`, error);
        }
    }
}