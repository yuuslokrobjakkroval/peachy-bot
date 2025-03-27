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
  // ModalBuilder,
  // TextInputBuilder,
  // TextInputStyle, zStringSelectMenuBuilder, EmbedBuilder,
} = require("discord.js");
// const JoinToCreateSchema = require('../../schemas/joinToCreate');
const GiveawaySchema = require("../../schemas/giveaway");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem");
const globalGif = require("../../utils/Gif");
const globalEmoji = require("../../utils/Emoji");
const globalConfig = require("../../utils/Config");

module.exports = class InteractionCreate extends Event {
  constructor(client, file) {
    super(client, file, { name: "interactionCreate" });
  }

  async run(interaction) {
    if (interaction.user.bot) return;
    if (globalConfig.env === "DEV") {
      if (interaction.guild.id !== "1354018322202492960") return;
    } else {
      if (interaction.guild.id === "1354018322202492960") return;
    }
    this.client
      .setColorBasedOnTheme(interaction.user.id)
      .then(async ({ user, color, emoji, language }) => {
        const prefix = this.client.config.prefix;
        // this.client.utils.getCheckingUser(this.client, interaction, user, color, emoji, prefix);
        if (
          interaction instanceof CommandInteraction &&
          interaction.type === InteractionType.ApplicationCommand
        ) {
          const command = this.client.commands.get(interaction.commandName);
          if (!command) return;

          if (user?.verification?.isBanned) {
            return;
          }

          const now = new Date();
          if (user?.verification?.timeout?.expiresAt > now) {
            const remainingTime = user.verification.timeout.expiresAt - now; // Remaining time in milliseconds

            // Calculate hours, minutes, and seconds
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor(
              (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

            // Construct the remaining time string
            let timeString = "";
            if (hours > 0) {
              timeString += `${hours} hr${hours > 1 ? "s" : ""}`;
            }
            if (minutes > 0) {
              if (timeString) timeString += ", ";
              timeString += `${minutes} min${minutes > 1 ? "s" : ""}`;
            }
            if (seconds > 0 || timeString === "") {
              if (timeString) timeString += ", ";
              timeString += `${seconds} sec${seconds > 1 ? "s" : ""}`;
            }

            return await interaction.message.send({
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
                .catch(() => {});
            }

            if (
              !interaction.guild.members.me.permissions.has(
                PermissionFlagsBits.EmbedLinks
              )
            ) {
              return await interaction.reply({
                content: "I don't have **`EmbedLinks`** permission.",
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
                  });
                }
              }
              if (command.permissions.user) {
                if (
                  !interaction.member.permissions.has(command.permissions.user)
                ) {
                  await interaction.reply({
                    content:
                      "You don't have enough permissions to use this command.",
                    flags: 64,
                  });
                  return;
                }
              }
            }

            if (!this.client.cooldown.has(interaction.commandName)) {
              this.client.cooldown.set(
                interaction.commandName,
                new Collection()
              );
            }

            const now = Date.now();
            const timestamps = this.client.cooldown.get(
              interaction.commandName
            );
            const cooldownAmount = Math.floor(command.cooldown || 5) * 1000;
            if (timestamps.has(interaction.user.id)) {
              const expirationTime =
                timestamps.get(interaction.user.id) + cooldownAmount;
              const timeLeft = (expirationTime - now) / 1000;
              if (now < expirationTime && timeLeft > 0.9) {
                return await interaction.reply({
                  content: `Please wait \`${timeLeft.toFixed(
                    1
                  )}\` more second(s) before reusing the **${
                    interaction.commandName
                  }** command.`,
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
              "angpav",
              "buy",
              "sell",
            ];
            const gamblingCommands = [
              "slots",
              "blackjack",
              "coinflip",
              "klaklouk",
            ];
            const gameCommands = [
              "2048",
              "guessnumber",
              "snake",
              "tictactoe",
              "post",
              "guess",
              "feedback",
              "wallpaper",
            ];
            const mineCommands = [
              "eat",
              "drink",
              "shop",
              "inventory",
              "giveitem",
            ];
            const utilityCommands = [
              "avatar",
              "emoji",
              "language",
              "qr",
              "serverinfo",
              "theme",
              "userinfo",
              "verify",
            ];
            const giveawaysCommands = [
              "giveaway",
              "giveawayshopitem",
              "reroll",
            ];
            const workCommands = [
              "applyjob",
              "police",
              "position",
              "rob",
              "student",
            ];

            let logChannelId;
            if (["animals"].includes(command.category.toLowerCase())) {
              logChannelId = this.client.config.logChannelId[8];
            } else if (["work"].includes(command.category.toLowerCase())) {
              logChannelId = this.client.config.logChannelId[7];
            } else if (["giveaway"].includes(command.category.toLowerCase())) {
              logChannelId = this.client.config.logChannelId[6];
            } else if (["utility"].includes(command.category.toLowerCase())) {
              logChannelId = this.client.config.logChannelId[5];
            } else if (mineCommands.includes(command.name)) {
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
                  `Command - ${this.client.utils.formatCapitalize(
                    interaction.commandName
                  )}`
                )
                .setThumbnail(interaction.guild.iconURL({ extension: "jpeg" }))
                .addFields([
                  {
                    name: "Author",
                    value: `**Name:** ${interaction.user.username}\n**Id:** ${interaction.user.id}\n**Channel:** ${interaction.channel.name}`,
                    inline: true,
                  },
                  {
                    name: "Extra Guild Info",
                    value: `\`\`\`arm
[+] Name: ${interaction.guild.name}
[+] Id: ${interaction.guild.id}
[+] Members: ${interaction.guild.memberCount.toString()}
\`\`\``,
                  },
                ])
                .setFooter({
                  text: interaction.user.username,
                  iconURL: interaction.user.displayAvatarURL({
                    extension: "jpeg",
                  }),
                })
                .setTimestamp();
              await channel
                .send({ embeds: [embed] })
                .catch(() => console.error("Error sending log message"));
            }
            return command.run(
              this.client,
              ctx,
              ctx.args,
              color,
              emoji,
              language
            );
          } catch (error) {
            console.error(
              `Error handling command ${interaction.commandName}:`,
              error
            );
            await interaction.reply({
              content: "An error occurred while processing the command.",
              flags: 64,
            });
          }
        } else if (
          interaction instanceof ButtonInteraction &&
          interaction.type === InteractionType.MessageComponent
        ) {
          // try {
          //   if (interaction.isButton()) {
          //     const config = await JoinToCreateSchema.findOne({ guildId: interaction.guild.id })
          //
          //     if (!config?.enabled) {
          //       const embed = this.client.embed()
          //           .setColor(color.danger)
          //           .setDescription('The Join to create system is not enabled in this server.');
          //       return interaction.reply({ embeds: [embed], flags: 64 })
          //     }
          //
          //     const tempChannel = config.tempChannels.find(tc => tc.channelId === interaction.channelId);
          //
          //     if (!tempChannel) return;
          //
          //     if (tempChannel.ownerId !== interaction.user.id) {
          //       const embed = this.client.embed()
          //           .setColor(color.danger)
          //           .setDescription('Only the Channel owner can use theses controls.');
          //       return interaction.reply({ embeds: [embed], flags: 64 });
          //     }
          //
          //     const channel = interaction.guild.channels.cache.get(tempChannel.channelId);
          //     if (!channel) return;
          //
          //     switch (interaction.customId) {
          //       case 'vc-lock': {
          //         const isLocked = tempChannel.locked;
          //         await channel.permissionOverwrites.edit(interaction.guild.id, {
          //           Connect: isLocked ? null : false
          //         });
          //
          //         await JoinToCreateSchema.findOneAndUpdate(
          //             { guildId: interaction.guild.id, "tempChannels.channelId": channel.id },
          //             { $set: {"tempChannels.$.locked": !isLocked } }
          //         );
          //         const embed = EmbedBuilder.from(interaction.message.embeds[0]).spliceFields(1, 1, { name: 'Status', value: !isLocked ? 'Locked' : 'Unlocked', inline: true });
          //         await interaction.message.edit({ embeds: [embed] });
          //
          //         if (!interaction.replied && !interaction.deferred) {
          //           const successEmbed = this.client.embed()
          //               .setColor(color.success)
          //               .setDescription(`Channel ${isLocked ? 'unlocked' : 'locked'} Successfully.`);
          //           await interaction.reply({embeds: [successEmbed], flags: 64});
          //         }
          //         break;
          //       }
          //
          //       case 'vc-hide': {
          //         const isHidden = tempChannel.hidden;
          //         await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: isHidden ? null : false });
          //
          //         await JoinToCreateSchema.findOneAndUpdate(
          //             { guildId: interaction.guild.id, "tempChannels.channelId": channel.id },
          //             { $set: {"tempChannels.$.hidden": !isHidden } }
          //         );
          //         const embed = EmbedBuilder.from(interaction.message.embeds[0]).spliceFields(2, 1, { name: 'Visibility', value: !isHidden ? 'Hidden' : 'Visible', inline: true });
          //         await interaction.message.edit({ embeds: [embed] });
          //
          //         if (!interaction.replied && !interaction.deferred) {
          //           const successEmbed = this.client.embed()
          //               .setColor(color.success)
          //               .setDescription(`Channel ${isHidden ? 'shown' : 'hidden'} Successfully.`);
          //           await interaction.reply({embeds: [successEmbed], flags: 64});
          //         }
          //         break;
          //       }
          //
          //       case 'vc-limit': {
          //         const modal = new ModalBuilder()
          //             .setCustomId('vc-limit-modal')
          //             .setTitle('Set Voice Channel Limit');
          //
          //         const limitInput = new TextInputBuilder()
          //             .setCustomId('limit')
          //             .setLabel('Enter User Limit (0-99)')
          //             .setStyle(TextInputStyle.Short)
          //             .setRequired(true)
          //             .setMinLength(1)
          //             .setMaxLength(2)
          //             .setPlaceholder('Enter a number (0 = No Limit)')
          //             .setValue(channel.userLimit.toString())
          //
          //         const actionRow = this.client.utils.createButtonRow(limitInput);
          //         modal.addComponents(actionRow)
          //
          //         await interaction.showModal(modal);
          //         break;
          //       }
          //
          //       case 'vc-kick': {
          //         const members = channel.members.filter(member => member.id !== tempChannel.ownerId);
          //         if (!members.size) {
          //           const embed = this.client.embed()
          //               .setColor(color.danger)
          //               .setDescription('There are no members to kick from the channel!');
          //           await interaction.reply({ embeds: [embed], flags: 64 });
          //         }
          //
          //         const row = this.client.utils.createButtonRow(
          //             new StringSelectMenuBuilder()
          //                 .setCustomId('vc-kick-select')
          //                 .setPlaceholder('Select a user to kick')
          //                 .addOptions(
          //                     members.map(member => ({
          //                       label: member.displayName,
          //                       description: `ID: ${member.id}`,
          //                       value: member.id
          //                     }))
          //                 )
          //         );
          //         if (!interaction.replied && !interaction.deferred) {
          //           const embed = this.client.embed()
          //               .setColor(color.main)
          //               .setDescription(`Select a user to kick`);
          //           await interaction.reply({content: "", embeds: [embed], components: [row], flags: 64});
          //         }
          //         break;
          //       }
          //     }
          //   }
          //
          //   if (interaction.isModalSubmit()) {
          //     if (interaction.customId === 'vc-limit-modal') {
          //       const config = await JoinToCreateSchema.findOne({ guildId: interaction.guild.id });
          //       if (!config) return;
          //
          //       const tempChannel = config.tempChannels.find(tc => tc.channelId === interaction.channelId)
          //       if (!tempChannel) return;
          //
          //       const channel = interaction.guild.channels.cache.get(tempChannel.channelId);
          //       if (!channel) return;
          //
          //       const limit = parseInt(interaction.fields.getTextInputValue('limit'));
          //       if (isNaN(limit) || limit < 0 || limit > 99) {
          //         const embed = this.client.embed()
          //             .setColor(color.danger)
          //             .setDescription('Please provide a valid number between 0 and 99')
          //         await interaction.reply({ embeds: [embed], flags: 64 });
          //       }
          //
          //       await channel.setUserLimit(limit);
          //       const message = await interaction.channel.messages.fetch(interaction.message.id);
          //       const embed = EmbedBuilder.from(message.embeds[0]).spliceFields(3, 1, { name: 'User Limit', value: limit ? `${limit} Users` : 'No limit', inline: true });
          //       await message.edit({ embeds: [embed] });
          //       if (!interaction.replied && !interaction.deferred) {
          //         const successEmbed = this.client.embed()
          //             .setColor(color.success)
          //             .setDescription(`Voice channel limit ${limit === 0 ? 'removed' : `set to ${limit}`}!`)
          //         await interaction.reply({embeds: [successEmbed], flags: 64});
          //       }
          //     }
          //   }
          //
          //   if (interaction.isStringSelectMenu()) {
          //     if (interaction.customId === 'vc-kick-select') {
          //       const config = await JoinToCreateSchema.findOne({ guildId: interaction.guild.id });
          //       if (!config) return;
          //
          //       const tempChannel = config.tempChannels.find(tc => tc.channelId === interaction.channelId)
          //       if (!tempChannel) return;
          //
          //       const channel = interaction.guild.channels.cache.get(tempChannel.channelId);
          //       if (!channel) return;
          //
          //       const targetId = interaction.values[0];
          //       const member = channel.members.get(targetId);
          //
          //       if (!member) {
          //         const embed = this.client.embed()
          //             .setColor(color.danger)
          //             .setDescription('Selected member is no longer in the channel.');
          //         return interaction.reply({ embeds: [embed], flags: 64 });
          //       }
          //       await member.voice.disconnect();
          //       const embed = this.client.embed()
          //           .setColor(color.success)
          //           .setDescription(`Successfully kicked ${member.displayName} from the channel.`);
          //       return interaction.reply({ embeds: [embed], flags: 64 });
          //     }
          //   }
          // } catch (err) {
          //   console.error(`Error handling command ${interaction.commandName}:`, err);
          // }

          switch (interaction.customId) {
            case "giveaway-join": {
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
                  flags: 64,
                });
              } else if (data.endTime * 1000 < Date.now()) {
                return this.client.utils.endGiveaway(
                  this.client,
                  color,
                  emoji,
                  interaction.message
                );
              } else if (data.ended) {
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
                  flags: 64,
                });
              } else if (data.paused) {
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
                  flags: 64,
                });
              } else if (data.entered.includes(interaction.user.id)) {
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
                  flags: 64,
                });

                const filter = (int) =>
                  int.isButton() && int.user.id === interaction.user.id;
                await interaction.channel
                  .awaitMessageComponent({ filter, time: 30000 })
                  .then(async (int) => {
                    if (int.customId === "leave-giveaway") {
                      data.entered = data.entered.filter(
                        (id) => id !== interaction.user.id
                      );
                      await data.save();

                      await int.reply({
                        embeds: [
                          this.client
                            .embed()
                            .setAuthor({
                              name: this.client.user.username,
                              iconURL: this.client.user.displayAvatarURL(),
                            })
                            .setColor(color.main)
                            .setDescription(
                              "You have successfully left the giveaway."
                            ),
                        ],
                        flags: 64,
                      });
                    } else {
                      int.deferUpdate();
                    }
                  })
                  .catch(() => {
                    console.log("No interaction collected or error occurred.");
                  });
              } else {
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
                  flags: 64,
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
              }
              break;
            }

            case "giveaway-participants": {
              const data = await GiveawaySchema.findOne({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: interaction.message.id,
              });

              if (!data.entered.length) {
                return interaction.reply({
                  content: "No participants found.",
                  flags: 64,
                });
              }

              const participants = await Promise.all(
                data.entered.map(async (id, index) => {
                  let member;
                  try {
                    member =
                      interaction.guild.members.cache.get(id) ||
                      (await interaction.guild.members.fetch(id));
                    if (!member) throw new Error("Member not found");
                  } catch (err) {
                    console.error(`Unable to fetch member with ID: ${id}`, err);
                    return null; // Skip this participant if they are not found
                  }
                  return `${index + 1}. <@${id}> (**1** entry)`;
                })
              );

              const validParticipants = participants.filter(
                (participant) => participant !== null
              );

              const embed = this.client
                .embed()
                .setTitle("Giveaway Participants")
                .setColor(color.main)
                .setDescription(
                  `These are the members who participated in the giveaway of **${this.client.utils.formatNumber(
                    data.prize
                  )}**:\n\n${validParticipants.join(
                    "\n"
                  )}\n\nTotal Participants: **${validParticipants.length}**`
                );

              await interaction.reply({ embeds: [embed], flags: 64 });
              break;
            }

            case "giveawayshopitem-join": {
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
                  flags: 64,
                });
              } else if (data.endTime * 1000 < Date.now()) {
                return this.client.utils.endGiveawayShopItem(
                  this.client,
                  color,
                  emoji,
                  interaction.message
                );
              } else if (data.ended) {
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
                  flags: 64,
                });
              } else if (data.paused) {
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
                  flags: 64,
                });
              } else if (data.entered.includes(interaction.user.id)) {
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
                  flags: 64,
                });

                const filter = (int) =>
                  int.isButton() && int.user.id === interaction.user.id;
                await interaction.channel
                  .awaitMessageComponent({ filter, time: 30000 })
                  .then(async (int) => {
                    if (int.customId === "leave-giveaway") {
                      data.entered = data.entered.filter(
                        (id) => id !== interaction.user.id
                      );
                      await data.save();

                      await int.reply({
                        embeds: [
                          this.client
                            .embed()
                            .setAuthor({
                              name: this.client.user.username,
                              iconURL: this.client.user.displayAvatarURL(),
                            })
                            .setColor(color.main)
                            .setDescription(
                              "You have successfully left the giveaway."
                            ),
                        ],
                        flags: 64,
                      });
                    } else {
                      int.deferUpdate();
                    }
                  })
                  .catch(() => {
                    console.log("No interaction collected or error occurred.");
                  });
              } else {
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
                  flags: 64,
                });

                const newLabel = data.entered.length;
                await interaction.message.edit({
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setCustomId("giveawayshopitem-join")
                        .setLabel(`${newLabel}`)
                        .setEmoji(`${emoji.main}`)
                        .setStyle(3),
                      new ButtonBuilder()
                        .setCustomId("giveawayshopitem-participants")
                        .setEmoji(globalEmoji.giveaway.participants)
                        .setLabel("Participants")
                        .setStyle(1)
                    ),
                  ],
                });
              }
              break;
            }

            case "giveawayshopitem-participants": {
              const data = await GiveawayShopItemSchema.findOne({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: interaction.message.id,
              });

              if (!data.entered.length) {
                return interaction.reply({
                  content: "No participants found.",
                  flags: 64,
                });
              }

              const participants = await Promise.all(
                data.entered.map(async (id, index) => {
                  let member;
                  try {
                    member =
                      interaction.guild.members.cache.get(id) ||
                      (await interaction.guild.members.fetch(id));
                    if (!member) throw new Error("Member not found");
                  } catch (err) {
                    console.error(`Unable to fetch member with ID: ${id}`, err);
                    return null; // Skip this participant if they are not found
                  }
                  return `${index + 1}. <@${id}> (**1** entry)`;
                })
              );

              const validParticipants = participants.filter(
                (participant) => participant !== null
              );

              const embed = this.client
                .embed()
                .setTitle("Giveaway Shop Item Participants")
                .setColor(color.main)
                .setDescription(
                  `These are the members who participated in the giveaway of **${this.client.utils.formatNumber(
                    data.amount
                  )}**:\n\n${validParticipants.join(
                    "\n"
                  )}\n\nTotal Participants: **${validParticipants.length}**`
                );

              await interaction.reply({ embeds: [embed], flags: 64 });
              break;
            }

            default:
              break;
          }
        }
      });
  }
};
