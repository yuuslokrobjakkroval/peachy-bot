const { ActionRowBuilder, ButtonBuilder, CommandInteraction, EmbedBuilder, Permissions, PermissionsBitField} = require('discord.js');
const Users = require('../schemas/user');
const WelcomeSchema = require("../schemas/welcomeMessages");
const AutoResponseSchema = require("../schemas/response");
const InviteTrackerSchema = require("../schemas/inviteTrackerMessages");
const JoinRolesSchema = require("../schemas/joinRoles");
const GoodByeMessagesSchema = require("../schemas/goodByeMessages");

let inviteData = {};

module.exports = class Ability {
    static async catchInvites(client) {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const invites = await guild.invites.fetch();
                if (!invites) return;
                inviteData[guildId] = new Map(invites.map(invite => [invite.code, invite.uses]));

            } catch (error) {
                if (error.code === 50013) {
                    continue;
                }
                continue;
            }
        }
    }

    static async getWelcomeMessage(client, member) {
        try {
            const welcomeMessage = await WelcomeSchema.findOne({ id: member.guild.id, isActive: true });
            const joinRoles = await JoinRolesSchema.findOne({ id: member.guild.id, isActive: true });
            const inviteTracker = await InviteTrackerSchema.findOne({ id: member.guild.id, isActive: true });


            if (welcomeMessage) {
                const { channel, content, message, isEmbed } = welcomeMessage;
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
                        welcomeChannel.send({ content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '' });
                    }
                }
            }

            if (joinRoles) {
                const { userRoles, botRoles } = joinRoles;
                const rolesToAssign = member.user.bot ? botRoles : userRoles;

                await Promise.all(
                    rolesToAssign.map(async (roleId) => {
                        const role = member.guild.roles.cache.get(roleId);

                        if(!role) return;

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
                    const { channel, content, message, isEmbed } = inviteTracker;
                    const currentInvites = await member.guild.invites.fetch();
                    const previousInvites = inviteData[member.guild.id] || new Map();

                    for (const invite of currentInvites.values()) {
                        const previousUses = previousInvites.get(invite.code) || 0;
                        if (invite.uses > previousUses) {
                            const inviter = invite.inviter;
                            previousInvites.set(invite.code, invite.uses);

                            const trackingChannel = member.guild.channels.cache.get(channel);
                            if (trackingChannel) {
                                if(isEmbed) {
                                    const trackerEmbed = await client.abilities.resultMessage(client, member, member.guild, message, invite, inviter);
                                    trackingChannel.send({
                                        content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '',
                                        embeds: trackerEmbed ? [trackerEmbed] : []
                                    });
                                }  else {
                                    trackingChannel.send({ content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '' });
                                }
                            }
                            break;
                        }
                    }

                    inviteData[member.guild.id] = new Map([...previousInvites, ...currentInvites.map(invite => [invite.code, invite.uses])]);
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
                const { channel, content, message, isEmbed } = goodByeMessage;
                const goodbyeChannel = member.guild.channels.cache.get(channel);

                if (goodbyeChannel){
                    if(isEmbed) {
                        const goodByeEmbed = await client.abilities.resultMessage(client, member, member.guild, message);
                        goodbyeChannel.send({
                            content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '',
                            embeds: goodByeEmbed ? [goodByeEmbed] : []
                        });
                    } else {
                        goodbyeChannel.send({ content: content ? await client.abilities.resultMessage(client, member, member.guild, content) : '' });
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
            usercreatedat: member.user.createdAt.toLocaleString(),
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

    // static getWelcomeMessage(client, member) {
    //     const memberCount = member.guild.memberCount;
    //     const guildName = member.guild.name;
    //
    //     return client.embed()
    //         .setColor(client.color.main)
    //         .setDescription(`# **WELCOME TO ${guildName}** ${emoji.main.signature}\n\n${emoji.border.topLeft}   ${client.utils.getLoopElement(emoji.border.bottomMiddle, 12)}   ${emoji.border.topRight}
    //
    //         > **${emoji.channel.announce}** : <#${globalConfig.channel.announcement}>
    //         > **${emoji.channel.rule}** : <#${globalConfig.channel.rule}>
    //         > **${emoji.channel.role}** : <#${globalConfig.channel.role}>
    //         > **${emoji.channel.booster}** : <#${globalConfig.channel.booster}>
    //         > **${emoji.channel.giveaway}** : <#${globalConfig.channel.giveaways}>
    //         \n${emoji.border.bottomLeft}   ${client.utils.getLoopElement(emoji.border.bottomMiddle, 12)}   ${emoji.border.bottomRight}\n\n**USER INFO** ${member}\n\n**NOW WE HAVE ${memberCount} MEMBERS**
    //     `)
    //         .setImage('https://i.imgur.com/MTOqT51.jpg')
    //         .setFooter({text: 'We hope you enjoy your stay!'})
    //         .setTimestamp();
    // }

    // static async getInviteMessage(client, member, invite, inviter) {
    //     const memberCount = member.guild.memberCount;
    //     const accountCreationDate = moment(member.user.createdAt).fromNow();
    //
    //     let inviteMember = 0;
    //     try {
    //         const result = await InviteTrackerSchema.aggregate([
    //             {
    //                 $group: {
    //                     _id: '$inviterId',
    //                     totalUses: { $sum: '$uses' },
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     inviterId: '$_id',
    //                     totalUses: 1,
    //                 }
    //             },
    //             { $sort: { totalUses: -1 } }
    //         ]).exec();
    //
    //         inviteMember = result.find(({ inviterId }) => inviterId === inviter.id)?.totalUses + 1 || 0;
    //
    //     } catch (err) {
    //         console.error(err);
    //     }
    //
    //     return client.embed()
    //         .setColor(client.color.main)
    //         .setThumbnail('https://i.imgur.com/jRjHmwW.gif')
    //         .setDescription(`## **Heyoo ${member}** ${emoji.main.signature}\nYou have joined the server ${emoji.congratulation}`)
    //         .addFields([
    //             {
    //                 name: `${emoji.inviteTracker.inviteBy} 𝑰𝒏𝒗𝒊𝒕𝒆 𝑩𝒚`,
    //                 value: `**${inviter.globalName ? inviter.globalName : inviter}**`,
    //                 inline: false
    //             },
    //             {
    //                 name: `${emoji.inviteTracker.inviteCode} 𝑰𝒏𝒗𝒊𝒕𝒆 𝑪𝒐𝒅𝒆`,
    //                 value: `**https://discord.gg/${invite.code}**`,
    //                 inline: false
    //             },
    //             {
    //                 name: `${emoji.inviteTracker.inviteStats} 𝑰𝒏𝒗𝒊𝒕𝒆𝒅 𝑴𝒆𝒎𝒃𝒆𝒓`,
    //                 value: `${inviteMember > 1 ? `${inviteMember} 𝑴𝒆𝒎𝒃𝒆𝒓𝒔` : `${inviteMember} 𝑴𝒆𝒎𝒃𝒆𝒓`}`,
    //                 inline: false
    //             },
    //             {
    //                 name: `${emoji.inviteTracker.memberCreated} 𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝑫𝒂𝒕𝒆`,
    //                 value: `${accountCreationDate}`,
    //                 inline: false
    //             },
    //             {
    //                 name: `${emoji.inviteTracker.inviteMember} 𝑴𝒆𝒎𝒃𝒆𝒓𝒔`,
    //                 value: `${memberCount} 𝑴𝒆𝒎𝒃𝒆𝒓𝒔`,
    //                 inline: false
    //             }
    //         ])
    //         .setImage('https://i.imgur.com/XiZrSty.gif')
    //         .setFooter({
    //             text: `Invite Tracker | Powered by ${client.user.displayName}`,
    //             iconURL: client.user.displayAvatarURL()
    //         })
    //         .setTimestamp();
    // }

    // static getGoodbyeMessage(client, member) {
    //     const memberCount = member.guild.memberCount;
    //     const guildName = member.guild.name;
    //
    //     return client.embed()
    //         .setColor(client.color.danger)
    //         .setDescription(`# **Goodbye from ${guildName}** ${emoji.main.signature}\n\nWe're sad to see you go, <@${member.id}> ${emoji.channel.poof}\n\n**NOW WE HAVE ${memberCount} MEMBERS LEFT**`)
    //         .setImage('https://i.imgur.com/t2s3fNF.jpg')
    //         .setFooter({text: 'Goodbye! We hope to see you again soon.'})
    //         .setTimestamp();
    // }
}