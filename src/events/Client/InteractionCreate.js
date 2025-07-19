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
                interaction.reply({
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
                interaction.reply({
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

            case "giveaway-join-req": {
              const giveaway = await client.utils.getGiveaway(interaction);
              if (!giveaway) return;

              // Check if user meets requirements
              const meetsRequirements =
                await client.utils.checkGiveawayRequirements(
                  client,
                  interaction.user,
                  giveaway,
                  interaction
                );

              if (!meetsRequirements) return;
              break;
            }

            case "modal": {
              await interaction.deferReply({ ephemeral: true });

              const Data = await verifySchema.findOne({ Guild: guild.id });
              const UserData = await userCaptcha.findOne({
                User: interaction.user.id,
              });

              if (!UserData) return; // No captcha data found for the user

              const answer = interaction.fields.getTextInputValue("answer");

              if (answer !== UserData.Captcha)
                return await interaction.editReply({
                  content: "That was wrong! try again.",
                  flags: 64,
                });
              else {
                // Correct captcha
                const roleID = Data.Role;
                const veriGuild = await client.guilds.fetch(guild.id);
                const member = await veriGuild.members.fetch(
                  interaction.user.id
                );
                await member.roles.add(roleID).catch((err) => {
                  interaction.editReply({
                    content: "There was an error.",
                    flags: 64,
                  });
                });

                await interaction.editReply({
                  content: "You have been verified.",
                });
              }
            }

            case "claim": {
              const userId = interaction.user.id;
              const user = await users.findOne({ userId });

              if (!user) {
                await interaction.reply({
                  content:
                    "You do not have an account. Create one to claim rewards.",
                  flags: 64,
                });
              } else {
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

                await interaction.update({
                  embeds: [embed],
                  components: [row],
                });
              }
            }

            default:
              break;
          }
        } else if (interaction.isModalSubmit()) {
          const userId = interaction.user.id;

          switch (true) {
            case interaction.customId.startsWith("tree-name-modal-"): {
              const treeName = interaction.fields.getTextInputValue("treeName");

              const existing = await Tree.findOne({ userId });
              if (existing) {
                return interaction.reply({
                  content: "You already have a tree!",
                  flags: 64,
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
                flags: 64,
              });
            }

            case interaction.customId.startsWith("rename-tree-modal-"): {
              const newName = interaction.fields
                .getTextInputValue("newTreeName")
                .trim();

              if (newName.length === 0) {
                return interaction.reply({
                  content: "Name cannot be empty!",
                  flags: 64,
                });
              }

              const userTree = await Tree.findOne({ userId });
              if (!userTree) {
                return interaction.reply({
                  content: "You don't have a tree yet.",
                  flags: 64,
                });
              }

              userTree.tree.name = newName;
              await userTree.save();

              return interaction.reply({
                content: `✅ Your tree has been renamed to **${newName}**!`,
                flags: 64,
              });
            }

            default:
              return interaction.reply({
                content: "Unknown modal interaction.",
                flags: 64,
              });
          }
        }
      });
  }
};
