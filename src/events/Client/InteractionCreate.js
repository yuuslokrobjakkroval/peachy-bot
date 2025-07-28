const { Context, Event } = require("../../structures/index.js");
const {
  Collection,
  CommandInteraction,
  InteractionType,
  PermissionFlagsBits,
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const users = require("../../schemas/user");
const Tree = require("../../schemas/tree");
const GiveawaySchema = require("../../schemas/giveaway");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem");
const userCaptcha = require("../../schemas/userCaptcha");
const verifySchema = require("../../schemas/verificationCaptcha");
const globalGif = require("../../utils/Gif");
const globalEmoji = require("../../utils/Emoji");
const globalConfig = require("../../utils/Config");

module.exports = class InteractionCreate extends Event {
  constructor(client, file) {
    super(client, file, { name: "interactionCreate" });
  }

  async run(interaction) {
    if (interaction.user.bot || interaction.channel.type === 1) return;
    if (globalConfig.env === "development") {
      if (interaction.guild.id !== "1371280484046344242") return;
    } else {
      if (interaction.guild.id === "1371280484046344242") return;
    }

    try {
      const { user, color, emoji, language } =
        await this.client.setColorBasedOnTheme(interaction.user.id);
      const prefix = this.client.config.prefix;

      if (
        interaction instanceof CommandInteraction &&
        interaction.type === InteractionType.ApplicationCommand
      ) {
        const command = this.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`Command ${interaction.commandName} not found`);
          return;
        }

        if (user?.verification?.isBanned) {
          return;
        }

        const now = new Date();
        if (user?.verification?.timeout?.expiresAt > now) {
          const remainingTime = user.verification.timeout.expiresAt - now;
          const hours = Math.floor(remainingTime / (1000 * 60 * 60));
          const minutes = Math.floor(
            (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

          let timeString = "";
          if (hours > 0) timeString += `${hours} hr${hours > 1 ? "s" : ""}`;
          if (minutes > 0)
            timeString += timeString
              ? ", "
              : "" + `${minutes} min${minutes > 1 ? "s" : ""}`;
          if (seconds > 0 || timeString === "")
            timeString += timeString
              ? ", "
              : "" + `${seconds} sec${seconds > 1 ? "s" : ""}`;

          return await interaction.reply({
            embeds: [
              this.client
                .embed()
                .setColor(color.danger)
                .setDescription(
                  `You are in timeout for: \`${
                    user.verification.timeout.reason || "No reason provided"
                  }\`.\nTimeout ends in **${timeString}**.`
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }

        const mention = new RegExp(`^<@!?${this.client.user.id}>( |)$`);
        if (mention.test(interaction.content)) {
          const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`Heyoo! ${interaction.user.displayName}`)
            .setDescription(
              `My Name is ${this.client.user.displayName}.\n` +
                `My prefix for this server is **\`${prefix}\`**.\n\n` +
                `Do you need help? please use **\`${prefix}help\`**!!!`
            )
            .setImage(globalGif.mentionBot)
            .setFooter({
              text: "Buy Me A Coffee | ABA: 500 057 310",
              iconURL: this.client.utils.emojiToImage(globalEmoji.buyMeCafe),
            });

          const clickSuppButton = this.client.utils.linkButton(
            "Click for support",
            this.client.config.links.support
          );
          const row = this.client.utils.createButtonRow(clickSuppButton);
          return interaction.reply({ embeds: [embed], components: [row] });
        }

        try {
          const ctx = new Context(interaction, interaction.options.data);
          ctx.setArgs(interaction.options.data);

          if (!interaction.inGuild()) return;

          if (
            !interaction.channel
              .permissionsFor(interaction.guild.members.me)
              .has(PermissionFlagsBits.ViewChannel)
          ) {
            return;
          }

          if (
            command.permissions.dev &&
            !this.client.config.owners.includes(interaction.user.id)
          ) {
            return;
          }

          if (
            !interaction.guild.members.me.permissions.has(
              PermissionFlagsBits.SendMessages
            )
          ) {
            return await interaction.member
              .send({
                content: `I don't have **\`SendMessages\`** permission in \`${interaction.guild.name}\`\nchannel: <#${interaction.channelId}>`,
              })
              .catch((err) =>
                console.error(
                  `Error sending DM to ${interaction.user.id}:`,
                  err
                )
              );
          }

          if (
            !interaction.guild.members.me.permissions.has(
              PermissionFlagsBits.EmbedLinks
            )
          ) {
            return await interaction.reply({
              content: "I don't have **`EmbedLinks`** permission.",
              flags: MessageFlags.Ephemeral,
            });
          }

          if (command.permissions) {
            if (command.permissions.client) {
              if (
                !interaction.guild.members.me.permissions.has(
                  command.permissions.client
                )
              ) {
                return await interaction.reply({
                  content:
                    "I don't have enough permissions to execute this command.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            if (command.permissions.user) {
              if (
                !interaction.member.permissions.has(command.permissions.user)
              ) {
                return await interaction.reply({
                  content:
                    "You don't have enough permissions to use this command.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
          }

          if (!this.client.cooldown.has(interaction.commandName)) {
            this.client.cooldown.set(interaction.commandName, new Collection());
          }

          const now = Date.now();
          const timestamps = this.client.cooldown.get(interaction.commandName);
          const cooldownAmount = Math.floor(command.cooldown || 5) * 1000;
          if (timestamps.has(interaction.user.id)) {
            const expirationTime =
              timestamps.get(interaction.user.id) + cooldownAmount;
            const timeLeft = (expirationTime - now) / 1000;
            if (now < expirationTime && timeLeft > 0.9) {
              return await interaction.reply({
                content: `Please wait \`${timeLeft.toFixed(1)}\` more second(s) before reusing the **${interaction.commandName}** command.`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }

          await this.client.utils.getValidationUser(
            this.client,
            interaction,
            user,
            color,
            emoji,
            interaction.commandName
          );

          const balanceCommands = [
            "balance",
            "deposit",
            "withdraw",
            "multitransfer",
            "transfer",
          ];
          const gamblingCommands = [
            "slots",
            "blackjack",
            "coinflip",
            "klaklouk",
          ];
          const gameCommands = ["guessnumber"];

          let logChannelId;
          if (
            ["admin", "staff", "developer", "guild"].includes(
              command.category.toLowerCase()
            )
          ) {
            logChannelId = this.client.config.logChannelId[9];
          } else if (
            ["animals", "building"].includes(command.category.toLowerCase())
          ) {
            logChannelId = this.client.config.logChannelId[8];
          } else if (["work"].includes(command.category.toLowerCase())) {
            logChannelId = this.client.config.logChannelId[7];
          } else if (["giveaway"].includes(command.category.toLowerCase())) {
            logChannelId = this.client.config.logChannelId[6];
          } else if (["utility"].includes(command.category.toLowerCase())) {
            logChannelId = this.client.config.logChannelId[5];
          } else if (["inventory"].includes(command.category.toLowerCase())) {
            logChannelId = this.client.config.logChannelId[4];
          } else if (balanceCommands.includes(command.name)) {
            logChannelId = this.client.config.logChannelId[3];
          } else if (gamblingCommands.includes(command.name)) {
            logChannelId = this.client.config.logChannelId[2];
          } else if (gameCommands.includes(command.name)) {
            logChannelId = this.client.config.logChannelId[1];
          } else {
            logChannelId = this.client.config.logChannelId[0];
          }

          const channel = this.client.channels.cache.get(logChannelId);
          if (channel && channel.isTextBased()) {
            const embed = this.client
              .embed()
              .setColor(color.blue)
              .setTitle(
                `Command - ${this.client.utils.formatCapitalize(interaction.commandName)}`
              )
              .setThumbnail(interaction.guild.iconURL({ extension: "jpeg" }))
              .addFields([
                {
                  name: "User Info",
                  value: `**Name:** ${interaction.user.username}\n**Id:** ${interaction.user.id}\n**Channel:** ${interaction.channel.name}`,
                  inline: true,
                },
                {
                  name: "Extra Guild Info",
                  value: `\`\`\`arm\n[+] Name: ${interaction.guild.name}\n[+] Id: ${interaction.guild.id}\n[+] Members: ${interaction.guild.memberCount.toString()}\n\`\`\``,
                },
              ])
              .setFooter({
                text: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({
                  extension: "jpeg",
                }),
              })
              .setTimestamp();
            await channel.send({ embeds: [embed] }).catch((err) => {
              console.error(
                `Error sending log to channel ${logChannelId}:`,
                err
              );
            });
          }

          await command.run(this.client, ctx, ctx.args, color, emoji, language);
        } catch (error) {
          console.error(
            `Error executing command ${interaction.commandName}:`,
            error
          );
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "An error occurred while processing the command.",
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      } else if (
        interaction instanceof ButtonInteraction &&
        interaction.type === InteractionType.MessageComponent
      ) {
        console.log(
          `Handling button interaction ${interaction.customId} for user ${interaction.user.id} in guild ${interaction.guild.id}`
        );

        switch (interaction.customId) {
          case "giveaway-join": {
            try {
              console.log(
                `🔍 Querying GiveawaySchema with guildId: ${interaction.guild.id}, channelId: ${interaction.channel.id}, messageId: ${interaction.message.id}`
              );
              const data = await GiveawaySchema.findOne({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: interaction.message.id,
              });

              if (!data) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription(
                        "An error occurred: Giveaway data not found."
                      ),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              if (data.endTime * 1000 < Date.now()) {
                return await this.client.utils.endGiveaway(
                  this.client,
                  color,
                  emoji,
                  interaction.message
                );
              }

              if (data.ended) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription("This giveaway has already ended."),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              if (data.paused) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription("This giveaway is currently paused."),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              if (data.entered.includes(interaction.user.id)) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.pink)
                      .setDescription(
                        "You are already entered in this giveaway. Would you like to leave?"
                      ),
                  ],
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setCustomId("leave-giveaway")
                        .setLabel("Leave Giveaway")
                        .setStyle(ButtonStyle.Danger)
                    ),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              data.entered.push(interaction.user.id);
              await data.save();

              await interaction.reply({
                embeds: [
                  this.client
                    .embed()
                    .setAuthor({
                      name: this.client.user.username,
                      iconURL: this.client.user.displayAvatarURL(),
                    })
                    .setColor(color.main)
                    .setDescription(
                      "You have successfully joined the giveaway."
                    ),
                ],
                flags: MessageFlags.Ephemeral,
              });

              const newLabel = data.entered.length;
              await interaction.message.edit({
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId("giveaway-join")
                      .setLabel(`${newLabel}`)
                      .setEmoji(emoji.main)
                      .setStyle(3),
                    new ButtonBuilder()
                      .setCustomId("giveaway-participants")
                      .setEmoji(globalEmoji.giveaway.participants)
                      .setLabel("Participants")
                      .setStyle(1)
                  ),
                ],
              });
            } catch (error) {
              console.error(
                `Error in giveaway-join handler for message ${interaction.message.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          case "leave-giveaway": {
            try {
              const data = await GiveawaySchema.findOne({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: interaction.message.id,
              });

              if (!data) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription(
                        "An error occurred: Giveaway data not found."
                      ),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              if (!data.entered.includes(interaction.user.id)) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription("You are not entered in this giveaway."),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              data.entered = data.entered.filter(
                (id) => id !== interaction.user.id
              );
              await data.save();

              await interaction.reply({
                embeds: [
                  this.client
                    .embed()
                    .setAuthor({
                      name: this.client.user.username,
                      iconURL: this.client.user.displayAvatarURL(),
                    })
                    .setColor(color.main)
                    .setDescription("You have successfully left the giveaway."),
                ],
                flags: MessageFlags.Ephemeral,
              });

              const newLabel = data.entered.length;
              await interaction.message.edit({
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId("giveaway-join")
                      .setLabel(`${newLabel}`)
                      .setEmoji(emoji.main)
                      .setStyle(3),
                    new ButtonBuilder()
                      .setCustomId("giveaway-participants")
                      .setEmoji(globalEmoji.giveaway.participants)
                      .setLabel("Participants")
                      .setStyle(1)
                  ),
                ],
              });
            } catch (error) {
              console.error(
                `Error in leave-giveaway handler for message ${interaction.message.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          case "giveaway-participants": {
            try {
              const data = await GiveawaySchema.findOne({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: interaction.message.id,
              });

              if (!data?.entered.length) {
                return interaction.reply({
                  content: "No participants found.",
                  flags: MessageFlags.Ephemeral,
                });
              }

              const participants = await Promise.all(
                data.entered.map(async (id, index) => {
                  try {
                    const member =
                      interaction.guild.members.cache.get(id) ||
                      (await interaction.guild.members.fetch(id));
                    return `${index + 1}. <@${id}> (**1** entry)`;
                  } catch (err) {
                    console.error(`Unable to fetch member ${id}:`, err);
                    return null;
                  }
                })
              );

              const validParticipants = participants.filter((p) => p !== null);

              const embed = this.client
                .embed()
                .setTitle("Giveaway Participants")
                .setColor(color.main)
                .setDescription(
                  `These are the members who participated in the giveaway of **${this.client.utils.formatNumber(
                    data.prize
                  )}**:\n\n${validParticipants.join("\n")}\n\nTotal Participants: **${validParticipants.length}**`
                );

              await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
              });
            } catch (error) {
              console.error(
                `Error in giveaway-participants handler for message ${interaction.message.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          case "giveawayshopitem-join": {
            try {
              const data = await GiveawayShopItemSchema.findOne({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: interaction.message.id,
              });

              if (!data) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription(
                        "An error occurred: Giveaway data not found."
                      ),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              if (data.endTime * 1000 < Date.now()) {
                return this.client.utils.endGiveawayShopItem(
                  this.client,
                  color,
                  emoji,
                  interaction.message
                );
              }

              if (data.ended) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription("This giveaway has already ended."),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              if (data.paused) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.danger)
                      .setDescription("This giveaway is currently paused."),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              if (data.entered.includes(interaction.user.id)) {
                return interaction.reply({
                  embeds: [
                    this.client
                      .embed()
                      .setAuthor({
                        name: this.client.user.username,
                        iconURL: this.client.user.displayAvatarURL(),
                      })
                      .setColor(color.pink)
                      .setDescription(
                        "You are already entered in this giveaway. Would you like to leave?"
                      ),
                  ],
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setCustomId("leave-giveaway")
                        .setLabel("Leave Giveaway")
                        .setStyle(ButtonStyle.Danger)
                    ),
                  ],
                  flags: MessageFlags.Ephemeral,
                });
              }

              data.entered.push(interaction.user.id);
              await data.save();

              await interaction.reply({
                embeds: [
                  this.client
                    .embed()
                    .setAuthor({
                      name: this.client.user.username,
                      iconURL: this.client.user.displayAvatarURL(),
                    })
                    .setColor(color.main)
                    .setDescription(
                      "You have successfully joined the giveaway."
                    ),
                ],
                flags: MessageFlags.Ephemeral,
              });

              const newLabel = data.entered.length;
              await interaction.message.edit({
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId("giveawayshopitem-join")
                      .setLabel(`${newLabel}`)
                      .setEmoji(emoji.main)
                      .setStyle(3),
                    new ButtonBuilder()
                      .setCustomId("giveawayshopitem-participants")
                      .setEmoji(globalEmoji.giveaway.participants)
                      .setLabel("Participants")
                      .setStyle(1)
                  ),
                ],
              });
            } catch (error) {
              console.error(
                `Error in giveawayshopitem-join handler for message ${interaction.message.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          case "giveawayshopitem-participants": {
            try {
              const data = await GiveawayShopItemSchema.findOne({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: interaction.message.id,
              });

              if (!data?.entered.length) {
                return interaction.reply({
                  content: "No participants found.",
                  flags: MessageFlags.Ephemeral,
                });
              }

              const participants = await Promise.all(
                data.entered.map(async (id, index) => {
                  try {
                    const member =
                      interaction.guild.members.cache.get(id) ||
                      (await interaction.guild.members.fetch(id));
                    return `${index + 1}. <@${id}> (**1** entry)`;
                  } catch (err) {
                    console.error(`Unable to fetch member ${id}:`, err);
                    return null;
                  }
                })
              );

              const validParticipants = participants.filter((p) => p !== null);

              const embed = this.client
                .embed()
                .setTitle("Giveaway Shop Item Participants")
                .setColor(color.main)
                .setDescription(
                  `These are the members who participated in the giveaway of **${this.client.utils.formatNumber(
                    data.amount
                  )}**:\n\n${validParticipants.join("\n")}\n\nTotal Participants: **${validParticipants.length}**`
                );

              await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
              });
            } catch (error) {
              console.error(
                `Error in giveawayshopitem-participants handler for message ${interaction.message.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          case "giveaway-join-req": {
            try {
              const giveaway = await this.client.utils.getGiveaway(interaction);
              if (!giveaway) {
                return interaction.reply({
                  content: "Giveaway not found.",
                  flags: MessageFlags.Ephemeral,
                });
              }

              const meetsRequirements =
                await this.client.utils.checkGiveawayRequirements(
                  this.client,
                  interaction.user,
                  giveaway,
                  interaction
                );

              if (!meetsRequirements) {
                return interaction.reply({
                  content:
                    "You do not meet the requirements for this giveaway.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            } catch (error) {
              console.error(
                `Error in giveaway-join-req handler for message ${interaction.message.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          case "modal": {
            try {
              await interaction.deferReply({ flags: MessageFlags.Ephemeral });

              const Data = await verifySchema.findOne({
                Guild: interaction.guild.id,
              });
              const UserData = await userCaptcha.findOne({
                User: interaction.user.id,
              });

              if (!UserData) {
                return await interaction.editReply({
                  content: "No captcha data found for this user.",
                  flags: MessageFlags.Ephemeral,
                });
              }

              const answer = interaction.fields.getTextInputValue("answer");

              if (answer !== UserData.Captcha) {
                return await interaction.editReply({
                  content: "That was wrong! Try again.",
                  flags: MessageFlags.Ephemeral,
                });
              }

              const roleID = Data.Role;
              const veriGuild = await this.client.guilds.fetch(
                interaction.guild.id
              );
              const member = await veriGuild.members.fetch(interaction.user.id);
              await member.roles.add(roleID).catch((err) => {
                console.error(
                  `Error adding role ${roleID} to user ${interaction.user.id}:`,
                  err
                );
                return interaction.editReply({
                  content: "There was an error adding the role.",
                  flags: MessageFlags.Ephemeral,
                });
              });

              await interaction.editReply({
                content: "You have been verified.",
                flags: MessageFlags.Ephemeral,
              });
            } catch (error) {
              console.error(
                `Error in modal handler for user ${interaction.user.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          case "claim": {
            try {
              const userId = interaction.user.id;
              const user = await users.findOne({ userId });

              if (!user) {
                return interaction.reply({
                  content:
                    "You do not have an account. Create one to claim rewards.",
                  flags: MessageFlags.Ephemeral,
                });
              }

              const claimedCoins =
                Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;

              await users.findOneAndUpdate(
                { userId },
                { $inc: { "balance.coin": claimedCoins } }
              );

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("claim")
                  .setLabel("Claimed")
                  .setEmoji("🕔")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(true)
              );

              const embed = this.client
                .embed()
                .setColor(this.client.color.main)
                .setDescription(
                  `Congratulations to <@${userId}> ! Claim successful! ${this.client.utils.formatNumber(
                    claimedCoins
                  )} ${this.client.emoji.coin} added to your balance.`
                );

              await interaction.update({ embeds: [embed], components: [row] });
            } catch (error) {
              console.error(
                `Error in claim handler for user ${interaction.user.id}:`,
                error
              );
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                  content: "An error occurred while processing your request.",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
            break;
          }

          default:
            console.warn(
              `Unhandled button interaction: ${interaction.customId}`
            );
            break;
        }
      } else if (interaction.isModalSubmit()) {
        const userId = interaction.user.id;

        try {
          switch (true) {
            case interaction.customId.startsWith("tree-name-modal-"): {
              const treeName = interaction.fields.getTextInputValue("treeName");

              const existing = await Tree.findOne({ userId });
              if (existing) {
                return interaction.reply({
                  content: "You already have a tree!",
                  flags: MessageFlags.Ephemeral,
                });
              }

              await Tree.create({
                userId,
                tree: {
                  name: treeName,
                  height: 1,
                  xp: 0,
                  level: 0,
                  lastWatered: 0,
                  waterCount: 0,
                },
              });

              return interaction.reply({
                content: `🌱 You planted **${treeName}**! Use \`/tree\` again to see it.`,
                flags: MessageFlags.Ephemeral,
              });
            }

            case interaction.customId.startsWith("rename-tree-modal-"): {
              const newName = interaction.fields
                .getTextInputValue("newTreeName")
                .trim();

              if (newName.length === 0) {
                return interaction.reply({
                  content: "Name cannot be empty!",
                  flags: MessageFlags.Ephemeral,
                });
              }

              const userTree = await Tree.findOne({ userId });
              if (!userTree) {
                return interaction.reply({
                  content: "You don't have a tree yet.",
                  flags: MessageFlags.Ephemeral,
                });
              }

              userTree.tree.name = newName;
              await userTree.save();

              return interaction.reply({
                content: `✅ Your tree has been renamed to **${newName}**!`,
                flags: MessageFlags.Ephemeral,
              });
            }

            default:
              console.warn(
                `Unhandled modal interaction: ${interaction.customId}`
              );
              return interaction.reply({
                content: "Unknown modal interaction.",
                flags: MessageFlags.Ephemeral,
              });
          }
        } catch (error) {
          console.error(
            `Error in modal submit handler for user ${userId}:`,
            error
          );
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content:
                "An error occurred while processing your modal submission.",
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      }
    } catch (error) {
      console.error(
        `Error in interactionCreate for interaction ${interaction.id}:`,
        error
      );
      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: "An unexpected error occurred. Please try again later.",
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) =>
            console.error(
              `Error sending fallback reply for interaction ${interaction.id}:`,
              err
            )
          );
      }
    }
  }
};
