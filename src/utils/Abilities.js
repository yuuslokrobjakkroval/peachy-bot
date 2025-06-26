const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const moment = require("moment");
const WelcomeSchema = require("../schemas/welcomeMessages");
const SendMessageSchema = require("../schemas/sendMessage");
const AutoResponseSchema = require("../schemas/response");
const BoosterSchema = require("../schemas/boosterMessages");
const InviteSchema = require("../schemas/inviteTracker");
const InviteTrackerSchema = require("../schemas/inviteTrackerMessages");
const JoinRolesSchema = require("../schemas/joinRoles");
const GoodByeMessagesSchema = require("../schemas/goodByeMessages");
const LevelingMessagesSchema = require("../schemas/levelingMessage");
const globalConfig = require("../utils/Config");
const globalEmoji = require("../utils/Emoji");

GlobalFonts.registerFromPath(
  "./src/data/fonts/Kelvinch-Roman.otf",
  "Kelvinch-Roman"
);
GlobalFonts.registerFromPath(
  "./src/data/fonts/Kelvinch-Bold.otf",
  "Kelvinch-Bold"
);
GlobalFonts.registerFromPath(
  "./src/data/fonts/Kelvinch-BoldItalic.otf",
  "Kelvinch-SemiBoldItalic"
);

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
                inviterId: invite.inviter?.id || "Unknown",
                inviterTag: invite.inviter?.tag || "Unknown",
              };

              await InviteSchema.updateOne(
                { inviteCode: invite.code },
                {
                  $set: {
                    guildId: guild.id,
                    guildName: guild.name,
                    inviterId: invite.inviter?.id || "Unknown",
                    inviterTag: invite.inviter?.tag || "Unknown",
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
            continue;
          }
          continue;
        }
      }
    } catch (error) {
      console.error("Error in syncInvites function:", error);
    }
  }

  static async getInviteCreate(invite) {
    const data = {
      guildId: invite.guild.id,
      guildName: invite.guild.name,
      inviteCode: invite.code,
      uses: invite.uses,
      userId: [], // Populate as needed
      inviterId: invite.inviter?.id || "Unknown",
      inviterTag: invite.inviter?.tag || "Unknown",
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

  static async getLevelingMessage(client, message, level) {
    try {
      const levelingMessage = await LevelingMessagesSchema.findOne({
        id: message.guild.id,
        isActive: true,
      });

      if (!levelingMessage) {
        return;
      }

      const { channel, content } = levelingMessage;
      const levelingChannel = message.member.guild.channels.cache.get(channel);

      if (!levelingChannel) {
        return;
      }

      const userInfo = await client.utils.getUser(message.member.id);

      if (!userInfo?.profile?.level) {
        console.warn(`No level data found for user ${message.member.id}`);
      }

      const processedContent = await client.abilities.resultMessage(
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
        content: processedContent || "",
      });
    } catch (error) {
      console.error("Error processing leveling message:", error);
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
        const { channel, content, message, image, isEmbed, isCustomImage } =
          welcomeMessage;
        const welcomeChannel = member.guild.channels.cache.get(channel);

        if (!welcomeChannel) {
          console.warn(
            `Welcome channel ${channel} not found in guild ${member.guild.name}.`
          );
          return;
        }

        if (welcomeChannel) {
          if (isEmbed) {
            const welcomeEmbed = await client.abilities.resultMessage(
              client,
              member,
              member.guild,
              message
            );
            welcomeChannel.send({
              content: content
                ? await client.abilities.replacePlaceholders(
                    client.abilities.getReplacementData(
                      member,
                      member.guild,
                      content
                    )
                  )
                : "",
              embeds: welcomeEmbed ? [welcomeEmbed] : [],
            });
          } else {
            const files = isCustomImage
              ? await client.abilities.getBackgroundCustom(
                  client,
                  member,
                  image
                )
              : await client.abilities.getBackgroundNormal(
                  client,
                  member,
                  image
                );
            welcomeChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              files: files ? [files] : [],
            });
          }
        }
      }

      if (joinRoles) {
        const { userRoles, botRoles } = joinRoles;
        const rolesToAssign = member.user.bot ? botRoles : userRoles;

        if (!rolesToAssign) {
          return;
        }

        await Promise.all(
          rolesToAssign.map(async (roleId) => {
            const role = member.guild.roles.cache.get(roleId);

            if (!role) {
              console.warn(
                `Role with ID ${roleId} not found in guild ${member.guild.name}`
              );
              return;
            }

            if (role) {
              try {
                await member.roles.add(role);
              } catch (error) {
                console.error(
                  `Failed to assign role ${role.name} to ${member.user.tag} in guild ${member.guild.name}:`,
                  error
                );
              }
            } else {
              console.warn(
                `Role with ID ${roleId} not found in guild ${member.guild.name}`
              );
            }
          })
        );
      }

      if (inviteTracker) {
        try {
          const { channel, content, message, image, isEmbed, isCustomImage } =
            inviteTracker;
          const currentInvites = await member.guild.invites.fetch();

          for (const invite of currentInvites.values()) {
            const previousInvite = await InviteSchema.findOne({
              guildId: member.guild.id,
              inviteCode: invite.code,
            });

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
                  const trackerEmbed = await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    message,
                    invite,
                    inviter
                  );
                  trackingChannel.send({
                    content: content
                      ? await client.abilities.resultMessage(
                          client,
                          member,
                          member.guild,
                          content
                        )
                      : "",
                    embeds: trackerEmbed ? [trackerEmbed] : [],
                  });
                } else {
                  const files = isCustomImage
                    ? await client.abilities.getBackgroundCustom(
                        client,
                        member,
                        image
                      )
                    : await client.abilities.getBackgroundNormal(
                        client,
                        member,
                        image
                      );
                  trackingChannel.send({
                    content: content
                      ? await client.abilities.resultMessage(
                          client,
                          member,
                          member.guild,
                          content,
                          invite,
                          inviter
                        )
                      : "",
                    files: files ? [files] : [],
                  });
                }

                if (member.guild.id === globalConfig.guildId) {
                  client.utils.getUser(inviter?.id).then(async (user) => {
                    if (!user) {
                      console.error(
                        `User not found in database: ${inviter?.id}`
                      );
                      return;
                    }

                    user.balance.coin += 300000;
                    await user.save(); // Ensure user data is saved before proceeding

                    await new Promise((resolve) => setTimeout(resolve, 2000)); // Sleep for 2 seconds

                    const inviterMention = `<@${inviter?.id}>`;

                    const giftEmbed = client
                      .embed()
                      .setColor(globalConfig.color.main)
                      .setDescription(
                        `# ${globalEmoji.giveaway.gift} GIFT FOR INVITER ${
                          globalEmoji.giveaway.gift
                        }\n${inviterMention} got reward **${client.utils.formatNumber(
                          300000
                        )}** ${
                          globalEmoji.coin
                        }\Thanks for inviting a new member to the server! We apprecite your help in growing our community!`
                      )
                      .setFooter({
                        text: "Enjoy your reward!",
                        iconURL: client.utils.emojiToImage(
                          globalEmoji.timestamp
                        ),
                      })
                      .setTimestamp();

                    trackingChannel.send({ embeds: [giftEmbed] });
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
          console.error(
            `Failed to fetch or update invites for guild ${member.guild.name}:`,
            error
          );
          if (error.code === 50013) {
            console.error(
              "Missing Permissions: Ensure the bot has the Manage Server permission."
            );
          }
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
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

      const matchingResponses = autoresponse.filter((response) =>
        response.trigger.toLowerCase().includes(message.content.toLowerCase())
      );

      if (!matchingResponses || matchingResponses.length === 0) return;

      const randomResponse =
        matchingResponses[Math.floor(Math.random() * matchingResponses.length)];
      if (!randomResponse?.response) {
        return;
      }

      const userInfo = await client.utils.getUser(message.author.id);
      if (!userInfo) {
        await message.reply(randomResponse.response);
        return;
      }

      const processedContent = await this.resultMessage(
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
        console.warn(
          `Failed to process response for trigger: ${message.content}`
        );
        await message.reply(randomResponse.response); // Fallback to raw response
      }
    } catch (error) {
      console.error(
        `Error processing auto-responses for guild ${message.guild.id}:`,
        error
      );
    }
  }

  static async getBoosterMessage(client, member) {
    try {
      const boosterMessage = await BoosterSchema.findOne({
        id: member.guild.id,
        isActive: true,
      });
      if (boosterMessage) {
        const { channel, content, message, image, isEmbed, isCustomImage } =
          boosterMessage;
        const boosterChannel = member.guild.channels.cache.get(channel);

        if (!boosterChannel) {
          console.warn(
            `Booster channel ${channel} not found in guild ${member.guild.name}.`
          );
          return;
        }

        if (boosterChannel) {
          if (isEmbed) {
            const boosterEmbed = await client.abilities.resultMessage(
              client,
              member,
              member.guild,
              message
            );
            boosterChannel.send({
              content: content
                ? await client.abilities.replacePlaceholders(
                    client.abilities.getReplacementData(
                      member,
                      member.guild,
                      content
                    )
                  )
                : "",
              embeds: boosterEmbed ? [boosterEmbed] : [],
            });
          } else {
            const files = isCustomImage
              ? await client.abilities.getBackgroundCustom(
                  client,
                  member,
                  image
                )
              : await client.abilities.getBackgroundNormal(
                  client,
                  member,
                  image
                );
            boosterChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              files: files ? [files] : [],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  static async getGoodByeMessage(client, member) {
    try {
      const goodByeMessage = await GoodByeMessagesSchema.findOne({
        id: member.guild.id,
        isActive: true,
      });

      if (goodByeMessage) {
        const { channel, content, message, image, isEmbed, isCustomImage } =
          goodByeMessage;
        const goodbyeChannel = member.guild.channels.cache.get(channel);

        if (goodbyeChannel) {
          if (isEmbed) {
            const goodByeEmbed = await client.abilities.resultMessage(
              client,
              member,
              member.guild,
              message
            );
            goodbyeChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              embeds: goodByeEmbed ? [goodByeEmbed] : [],
            });
          } else {
            const files = isCustomImage
              ? await client.abilities.getBackgroundCustom(
                  client,
                  member,
                  image
                )
              : await client.abilities.getBackgroundNormal(
                  client,
                  member,
                  image
                );
            goodbyeChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              files: files ? [files] : [],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing goodbye message:", error);
    }
  }

  static async getSendMessage(client) {
    try {
      const sendMessage = await SendMessageSchema.findOne({ isActive: true });
      if (!sendMessage) {
        return;
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

      return await await client.abilities.SendMessage(client, member, feature);
    } catch (error) {
      console.error("Error processing message:", error);
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

      if (welcomeMessage && feature === "welcome-message") {
        const { channel, content, message, image, isEmbed, isCustomImage } =
          welcomeMessage;
        const welcomeChannel = member.guild.channels.cache.get(channel);

        if (!welcomeChannel) {
          console.warn(
            `Welcome channel ${channel} not found in guild ${member.guild.name}.`
          );
          return;
        }

        if (welcomeChannel) {
          if (isEmbed) {
            const welcomeEmbed = await client.abilities.resultMessage(
              client,
              member,
              member.guild,
              message
            );
            welcomeChannel.send({
              content: content
                ? await client.abilities.replacePlaceholders(
                    client.abilities.getReplacementData(
                      member,
                      member.guild,
                      content
                    )
                  )
                : "",
              embeds: welcomeEmbed ? [welcomeEmbed] : [],
            });
          } else {
            const files = isCustomImage
              ? await client.abilities.getBackgroundCustom(
                  client,
                  member,
                  image
                )
              : await client.abilities.getBackgroundNormal(
                  client,
                  member,
                  image
                );
            welcomeChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              files: files ? [files] : [],
            });
          }
        }
      }

      if (boosterMessage && feature === "booster-message") {
        const { channel, content, message, image, isEmbed, isCustomImage } =
          boosterMessage;
        const boosterChannel = member.guild.channels.cache.get(channel);

        if (!boosterChannel) {
          console.warn(
            `Booster channel ${channel} not found in guild ${member.guild.name}.`
          );
          return;
        }

        if (boosterChannel) {
          if (isEmbed) {
            const boosterEmbed = await client.abilities.resultMessage(
              client,
              member,
              member.guild,
              message
            );
            boosterChannel.send({
              content: content
                ? await client.abilities.replacePlaceholders(
                    client.abilities.getReplacementData(
                      member,
                      member.guild,
                      content
                    )
                  )
                : "",
              embeds: boosterEmbed ? [boosterEmbed] : [],
            });
          } else {
            const files = isCustomImage
              ? await client.abilities.getBackgroundCustom(
                  client,
                  member,
                  image
                )
              : await client.abilities.getBackgroundNormal(
                  client,
                  member,
                  image
                );
            boosterChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              files: files ? [files] : [],
            });
          }
        }
      }

      if (inviteTracker && feature === "invite-tracker-message") {
        try {
          const { channel, content, message, image, isEmbed, isCustomImage } =
            inviteTracker;
          const currentInvites = await member.guild.invites.fetch();

          for (const invite of currentInvites.values()) {
            const previousInvite = await InviteSchema.findOne({
              guildId: member.guild.id,
              inviteCode: invite.code,
            });

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
                  const trackerEmbed = await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    message,
                    invite,
                    inviter
                  );
                  trackingChannel.send({
                    content: content
                      ? await client.abilities.resultMessage(
                          client,
                          member,
                          member.guild,
                          content
                        )
                      : "",
                    embeds: trackerEmbed ? [trackerEmbed] : [],
                  });
                } else {
                  const files = isCustomImage
                    ? await client.abilities.getBackgroundCustom(
                        client,
                        member,
                        image
                      )
                    : await client.abilities.getBackgroundNormal(
                        client,
                        member,
                        image
                      );
                  trackingChannel.send({
                    content: content
                      ? await client.abilities.resultMessage(
                          client,
                          member,
                          member.guild,
                          content,
                          invite,
                          inviter
                        )
                      : "",
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
          console.error(
            `Failed to fetch or update invites for guild ${member.guild.name}:`,
            error
          );
          if (error.code === 50013) {
            console.error(
              "Missing Permissions: Ensure the bot has the Manage Server permission."
            );
          }
        }
      }

      if (goodByeMessage && feature === "goodbye-message") {
        const { channel, content, message, image, isEmbed, isCustomImage } =
          goodByeMessage;
        const goodbyeChannel = member.guild.channels.cache.get(channel);

        if (goodbyeChannel) {
          if (isEmbed) {
            const goodByeEmbed = await client.abilities.resultMessage(
              client,
              member,
              member.guild,
              message
            );
            goodbyeChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              embeds: goodByeEmbed ? [goodByeEmbed] : [],
            });
          } else {
            const files = isCustomImage
              ? await client.abilities.getBackgroundCustom(
                  client,
                  member,
                  image
                )
              : await client.abilities.getBackgroundNormal(
                  client,
                  member,
                  image
                );
            goodbyeChannel.send({
              content: content
                ? await client.abilities.resultMessage(
                    client,
                    member,
                    member.guild,
                    content
                  )
                : "",
              files: files ? [files] : [],
            });
          }
        }
      }

      if (levelingMessage && feature === "leveling-system") {
        const { channel, content } = levelingMessage;
        const levelingChannel = member.guild.channels.cache.get(channel);
        const userInfo = await client.utils.getUser(member.id);
        if (levelingChannel) {
          levelingChannel.send({
            content: content
              ? await client.abilities.resultMessage(
                  client,
                  member,
                  member.guild,
                  content,
                  null,
                  null,
                  userInfo
                )
              : "",
          });
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  static replacePlaceholders(str, data) {
    if (!str || typeof str !== "string") return str; // Return the input if it's not a string
    return str.replace(/\${(.*?)}/g, (_, key) => data[key] || `\${${key}}`); // Replace placeholders with data values
  }

  static getReplacementData(member, guild, invite, inviter, user, level) {
    const accountCreationDate = moment(member.user.createdAt).fromNow();
    const guildTotalBoosts = guild.premiumSubscriptionCount || 0;
    const guildBoostLevel = guild.premiumTier || 0;
    const boostsMissingForNext =
      [2, 7, 14][guildBoostLevel] - guildTotalBoosts || 0;
    const nextBoostLevel = guildBoostLevel < 3 ? guildBoostLevel + 1 : "Max";

    return {
      // User
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

      // Guild
      guildid: guild.id,
      guildname: guild.name,
      guildiconurl: guild.iconURL(),
      guildbannerurl: guild.bannerURL(),
      guildmembercount: guild.memberCount,
      guildvanitycode: guild.vanityURLCode,

      // Boost
      guildtotalboosts: guildTotalBoosts,
      guildboostlevel: guildBoostLevel,
      guildboostsmissingfornext:
        boostsMissingForNext >= 0 ? boostsMissingForNext : 0,
      guildboostnextlevel: nextBoostLevel,

      // Invite
      invitecode: invite?.code || "N/A",
      inviteurl: invite ? `https://discord.gg/${invite.code}` : "N/A",
      invitechannel: invite?.channel?.name || "N/A",
      inviteuses: invite?.uses || 0,

      // Inviter
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

      // Level
      oldLevel: user?.profile?.level - 1 || 0,
      currentLevel: user?.profile?.level || 1,
      nextLevel: user?.profile?.level + 1 || 0,
      currentXP: user?.profile?.xp || 0,
      requiredXP: user?.profile?.levelXp || 0,
      xpGained: user?.profile?.lastXpGain || 0,
    };
  }

  static async resultMessage(
    client,
    member,
    guild,
    result,
    invite,
    inviter,
    userInfo,
    level
  ) {
    const data = client.abilities.getReplacementData(
      member,
      guild,
      invite,
      inviter,
      userInfo,
      level
    );

    if (typeof result !== "object") {
      return client.abilities.replacePlaceholders(result, data);
    } else {
      const embed = client.embed().setColor(result.message?.color || "#F582AE"); // Set default color

      // Only set title if it's not null or empty
      if (result.message?.title) {
        embed.setTitle(
          client.abilities.replacePlaceholders(result.message.title, data)
        );
      }

      // Only set description if it's not null or empty
      if (result.message?.description) {
        embed.setDescription(
          client.abilities.replacePlaceholders(result.message.description, data)
        );
      }

      // Only set thumbnail if it's not null or empty
      if (result.message?.thumbnail) {
        embed.setThumbnail(
          client.abilities.replacePlaceholders(result.message.thumbnail, data)
        );
      }

      // Only set image if it's not null or empty
      if (result.message?.image) {
        embed.setImage(
          client.abilities.replacePlaceholders(result.message.image, data)
        );
      }

      // Only set footer if there's footer text or iconURL
      if (result.message?.footer) {
        const footerText = client.abilities.replacePlaceholders(
          result.message.footer.text,
          data
        );
        const footerIconURL = client.abilities.replacePlaceholders(
          result.message.footer.iconURL,
          data
        );

        if (footerText || footerIconURL) {
          // Only set if there is valid content
          embed.setFooter(footerText, footerIconURL);
        }
      }

      // Add fields if they exist and are not empty
      if (result.message?.fields && result.message.fields.length > 0) {
        result.message.fields.forEach((field) => {
          if (field.name && field.value) {
            // Ensure both name and value are not null, undefined or empty
            embed.addFields({
              name: client.abilities.replacePlaceholders(field.name, data),
              value: client.abilities.replacePlaceholders(field.value, data),
              inline: field.inline ?? false, // Default to false if inline is not defined
            });
          }
        });
      }

      embed.setTimestamp();

      return embed;
    }
  }

  static async getBackgroundNormal(client, member, data) {
    if (data.backgroundImage) {
      return data.backgroundImage;
    } else {
      return "https://i.imgur.com/fFqwcK2.gif";
    }
  }

  static async getBackgroundCustom(client, member, data) {
    const width = 800; // Set canvas width
    const height = 450; // Set canvas height

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    let background;
    if (data.backgroundImage) {
      background = await loadImage(data.backgroundImage);
      if (background) {
        ctx.drawImage(background, 0, 0, width, height);
      } else {
        ctx.fillStyle = "#DFF2EB";
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = "#DFF2EB";
      ctx.fillRect(0, 0, width, height);
    }

    const avatar = await loadImage(
      member.displayAvatarURL({ format: "png", size: 256 })
    );
    const userAvatarSize = 128;
    const userAvatarX = width / 2 - userAvatarSize / 2;
    const userAvatarY = 100;

    ctx.textAlign = "center";

    // Apply shadow for text
    ctx.shadowColor = "rgba(0, 0, 0, 1)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // FEATURE Text
    ctx.font = "Bold 72px Kelvinch-Bold, Arial";
    ctx.fillStyle = data.featureColor;
    ctx.fillText(data.feature, width / 2, 300);

    // Username
    ctx.font = "32px Kelvinch-Bold, Arial";
    ctx.fillStyle = data.usernameColor;
    ctx.fillText(
      client.utils.formatUpperCase(member.user.username),
      width / 2,
      340
    );

    // Message
    ctx.font = "28px Kelvinch-Bold, Arial";
    ctx.fillStyle = data.messageColor;
    ctx.fillText(data.message, width / 2, 380);

    // Reset shadow settings
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (data.avatarShape === "Square") {
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
      ctx.lineTo(
        userAvatarX + userAvatarSize,
        userAvatarY + userAvatarSize - borderRadius
      );
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
      ctx.arcTo(
        userAvatarX,
        userAvatarY,
        userAvatarX + borderRadius,
        userAvatarY,
        borderRadius
      );
      ctx.closePath();

      ctx.lineWidth = 8;
      ctx.strokeStyle = data.circleColor;
      ctx.stroke();

      ctx.clip();
      ctx.drawImage(
        avatar,
        userAvatarX,
        userAvatarY,
        userAvatarSize,
        userAvatarSize
      );
    } else {
      ctx.beginPath();
      ctx.arc(
        userAvatarX + userAvatarSize / 2,
        userAvatarY + userAvatarSize / 2,
        userAvatarSize / 2 + 2,
        0,
        Math.PI * 2,
        true
      ); // Slightly larger circle

      ctx.lineWidth = 8;
      ctx.strokeStyle = data.circleColor;
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(
        avatar,
        userAvatarX,
        userAvatarY,
        userAvatarSize,
        userAvatarSize
      );
    }

    return new AttachmentBuilder(canvas.toBuffer("image/png"), {
      name: `${data.feature}.png`,
    });
  }
};
