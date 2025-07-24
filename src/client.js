const {
  Partials,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
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
const AntiLinkSchema = require("./schemas/antiLink");
const GiveawaySchema = require("./schemas/giveaway");
const GiveawayShopItemSchema = require("./schemas/giveawayShopItem");
const ConversationSchema = require("./schemas/conversation");
const InviteSchema = require("./schemas/inviteTracker");
const globalConfig = require("./utils/Config");
const PeachyClient = require("./structures/Client.js");
const EconomyManager = require("./managers/EconomyManager");
const ResourceManager = require("./managers/ResourceManager");
const cron = require("node-cron");

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
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.GuildScheduledEvent,
  ],
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: false,
  },
  autoReconnect: true,
  restTimeOffset: 0,
};

const client = new PeachyClient(clientOptions);

// Initialize ResourceManager
client.resourceManager = new ResourceManager(client);
client.economyManager = new EconomyManager(client);
client.logger.info("Economy initialized");
client.setMaxListeners(30);

client.once("ready", async () => {
  client.utils.cacheItems();
  client.logger.info("Item cache initialized!");

  // cron.schedule("0 17 * * 6", client.utils.weeklyReset);
  cron.schedule(
    "01 22 * * *",
    () => {
      client.utils
        .checkBooster(client)
        .then(() => console.log("Booster/Sponsor check completed."))
        .catch((err) =>
          console.error("Error in Booster/Sponsor function:", err)
        );
    },
    {
      scheduled: true,
      timezone: "Asia/Bangkok",
    }
  );
  client.logger.info(
    "Booster/Sponsor check scheduled at 10:01 PM Asia/Bangkok"
  );

  cron.schedule(
    "01 19 * * *",
    () => {
      client.utils
        .createGiveaway(client)
        .then(() => console.log("Giveaway was create sucessfully."))
        .catch((err) => console.error("Error in Giveaway function:", err));
    },
    {
      scheduled: true,
      timezone: "Asia/Bangkok",
    }
  );
  client.logger.info("Giveaway check scheduled at 7PM Asia/Bangkok");

  return await client.abilities.syncInvites(client);
});

client.on(
  "guildMemberAdd",
  async (member) => await client.abilities.getWelcomeMessage(client, member)
);

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (oldMember.premiumSince === null && newMember.premiumSince !== null) {
    // Member has just boosted the server
    await client.abilities.getBoosterMessage(client, newMember);
  }
});

client.on("guildMemberRemove", async (member) => {
  try {
    await client.abilities.getGoodByeMessage(client, member);
  } catch (error) {
    console.error("Error in getGoodByeMessage:", error);
  }
});

client.on("messageCreate", async (message) => {
  if (message.channel.type === ChannelType.DM) {
    if (message.author.bot) return;

    if (isKhmer(message.content)) {
      try {
        await message.channel.sendTyping();

        let recentMessages = [];

        if (hasPeachy(message.content)) {
          // Get or create global conversation
          let conversation = await ConversationSchema.findById("global");
          if (!conversation) {
            conversation = new ConversationSchema({
              _id: "global",
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
            role: msg.fromBot ? "model" : "user",
            content: msg.content,
          }));
        }

        const aiResponse = await client.utils.generateAIResponse(
          message.content,
          recentMessages
        );

        if (hasPeachy(message.content)) {
          let conversation = await ConversationSchema.findById("global");
          conversation.messages.push({
            userId: "bot",
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
          .send(
            "សូមអភ័យទោស មានបញ្ហាក្នុងការឆ្លើយតប។ សូមទាក់ទងមក server គាំទ្រសម្រាប់ជំនួយ។"
          )
          .catch((err) => console.error(`DM failed:`, err));
      }
    } else {
      return await message.author
        .send(
          "សូមអភ័យទោស ខ្ញុំមិនអាចឆ្លើយតបជាភាសាអង់គ្លេសបានទេ។ សូមប្រើភាសាខ្មែរ។"
        )
        .catch((error) =>
          console.error(`Failed to send DM to ${message.author.tag}:`, error)
        );
    }
  } else {
    if (message.attachments.size > 0 || !message.content.trim()) {
      return;
    }

    if (
      message.content.startsWith(globalConfig.prefix) ||
      message.content.startsWith(globalConfig.prefix.toLowerCase())
    ) {
      const channelId = message.channel.id;
      messageCount.set(channelId, (messageCount.get(channelId) || 0) + 1);
      if (messageCount.get(channelId) === 10) {
        const embed = client
          .embed()
          .setColor(client.color.main)
          .setTitle("Surprise Drop!")
          .setDescription("Claim your coins now!")
          .addFields({
            name: "Lucky Coin",
            value: `${client.utils.formatNumber(
              Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000
            )} ${client.emoji.coin}`,
          });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("claim")
            .setLabel("Claim")
            .setEmoji("🎁")
            .setStyle(ButtonStyle.Primary)
        );

        message.channel.send({ embeds: [embed], components: [row] });
        messageCount.set(channelId, 0); // Reset count
      }
    }

    if (
      message.content.startsWith("http") ||
      message.content.startsWith("discord.gg")
    ) {
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
          console.error("Error handling anti-link message:", error);
        }
      }
    }

    await client.abilities.getAutoResponse(client, message);
  }
});

client.on(
  "inviteCreate",
  async (invite) => await client.abilities.getInviteCreate(invite)
);

setInterval(
  async () => {
    try {
      await client.utils.getResetThief(client);
    } catch (error) {
      console.error("Error resetting rob status:", error);
    }
  },
  3 * 60 * 1000
);

setInterval(async () => {
  return await client.abilities.getSendMessage(client);
}, 20000);

setInterval(() => {
  const guild = client.guilds.cache.get(client.config.guildId);
  if (!guild) {
    console.error("Guild not found");
    return;
  }

  guild.invites
    .fetch()
    .then((invites) => {
      if (!invites || invites.length === 0) {
        return;
      }
      const inviteCodes = invites.map((invite) => invite.code);

      InviteSchema.find({ guildId: guild.id })
        .then((dbInvites) => {
          dbInvites.forEach((dbInvite) => {
            if (!inviteCodes.includes(dbInvite.inviteCode)) {
              dbInvite
                .deleteOne()
                .catch((error) =>
                  console.error("Error deleting invite from DB:", error)
                );
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
                  return newInvite
                    .save()
                    .catch((error) =>
                      console.error("Error saving new invite:", error)
                    );
                } else {
                  existingInvite.uses = invite.uses;
                  return existingInvite
                    .save()
                    .catch((error) =>
                      console.error("Error updating existing invite:", error)
                    );
                }
              })
              .catch((error) =>
                console.error("Error finding invite in DB:", error)
              );
          });

          return Promise.all(invitePromises);
        })
        .catch((error) =>
          console.error("Error processing invites from DB:", error)
        );
    })
    .catch((error) => console.error("Error fetching invites:", error));
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
          client.channels.cache
            .get(giveaway.channelId)
            ?.messages.fetch(giveaway.messageId)
            .then((giveawayMessage) => {
              if (giveawayMessage) {
                client.utils
                  .endGiveaway(
                    client,
                    client.color,
                    client.emoji,
                    giveawayMessage,
                    giveaway.autopay
                  )
                  .then(() => {
                    giveaway.ended = true;
                    return giveaway.save();
                  })
                  .catch((err) => console.error("Error ending giveaway:", err));
              }
            })
            .catch((err) => {
              if (err.code === 10008) {
                console.warn(
                  `Message with ID ${giveaway.messageId} was not found.`
                );
                giveaway.ended = true;
                giveaway.save().catch(console.error);
              } else {
                console.error("Error fetching message:", err);
              }
            });
        }
      });
    })
    .catch((err) => {
      console.error("Error finding giveaways:", err);
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
                  .endGiveawayShopItem(
                    client,
                    client.color,
                    client.emoji,
                    giveawayMessage,
                    giveaway.autoAdd
                  )
                  .then(() => {
                    giveaway.ended = true;
                    return giveaway.save();
                  })
                  .catch((err) =>
                    console.error("Error ending giveaway shop item:", err)
                  );
              }
            })
            .catch((err) => {
              if (err.code === 10008) {
                console.warn(
                  `Message with ID ${giveaway.messageId} was not found.`
                );
                giveaway.ended = true;
                giveaway.save().catch(console.error);
              } else {
                console.error("Error fetching message:", err);
              }
            });
        }
      });
    })
    .catch((err) => {
      console.error("Error finding giveaway shop items:", err);
    });
}, 10000);

setTimeout(() => {
  client.utils
    .checkBirthdays(client)
    .then(() => console.log("Birthday check completed."))
    .catch((err) => console.error("Error in checkBirthdays function:", err));

  // Repeat every 24 hours after the initial execution
  setInterval(
    () => {
      client.utils
        .checkBirthdays(client)
        .then(() => console.log("Birthday check completed."))
        .catch((err) =>
          console.error("Error in checkBirthdays function:", err)
        );
    },
    24 * 60 * 60 * 1000
  ); // 24 hours
}, client.utils.getDelayUntil7PM());

client.start(globalConfig.token);
