const { Context, Event } = require('../../structures/index.js');
const {
  Collection,
  CommandInteraction,
  InteractionType,
  PermissionFlagsBits,
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const GiveawaySchema = require('../../schemas/giveaway');
const GiveawayShopItemSchema = require('../../schemas/giveawayShopItem');

module.exports = class InteractionCreate extends Event {
  constructor(client, file) {
    super(client, file, { name: 'interactionCreate' });
  }

  async run(interaction) {
    if (interaction.user.bot || !interaction.guild) return;

    this.client.setColorBasedOnTheme(interaction.user.id).then(async ({user, color, emoji, language}) => {
      if (interaction instanceof CommandInteraction && interaction.type === InteractionType.ApplicationCommand) {
        const command = this.client.commands.get(interaction.commandName);
        if (!command) return;

        if (user?.verification?.isBanned) {
          return;
        }

        const now = new Date();
        if (user?.verification?.timeout?.expiresAt && user.verification.timeout.expiresAt > now) {
          const remainingTime = user.verification.timeout.expiresAt - now; // Remaining time in milliseconds

          // Calculate hours, minutes, and seconds
          const hours = Math.floor(remainingTime / (1000 * 60 * 60));
          const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

          // Construct the remaining time string
          let timeString = '';
          if (hours > 0) {
            timeString += `${hours} hr${hours > 1 ? 's' : ''}`;
          }
          if (minutes > 0) {
            if (timeString) timeString += ', ';
            timeString += `${minutes} min${minutes > 1 ? 's' : ''}`;
          }
          if (seconds > 0 || timeString === '') {
            if (timeString) timeString += ', ';
            timeString += `${seconds} sec${seconds > 1 ? 's' : ''}`;
          }

          return await interaction.message.send({
            embeds: [
              this.client.embed()
                  .setColor(color.danger)
                  .setDescription(`You are in timeout for: \`${user.verification.timeout.reason || 'No reason provided'}\`.\nTimeout ends in **${timeString}**.`)
            ]
          });
        }

        try {
          const ctx = new Context(interaction, interaction.options.data);
          ctx.setArgs(interaction.options.data);

          if (!interaction.inGuild()) return;

          if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) {
            return;
          }
          
          if (command.permissions.dev && !this.client.config.owners.includes(interaction.user.id)) {
            return;
          }

          if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) {
            return await interaction.member.send({
              content: `I don't have **\`SendMessages\`** permission in \`${interaction.guild.name}\`\nchannel: <#${interaction.channelId}>`,
            }).catch(() => {
            });
          }

          if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) {
            return await interaction.reply({
              content: "I don't have **`EmbedLinks`** permission.",
            });
          }

          if (command.permissions) {
            if (command.permissions.client) {
              if (!interaction.guild.members.me.permissions.has(command.permissions.client)) {
                return await interaction.reply({
                  content: "I don't have enough permissions to execute this command.",
                });
              }
            }
            if (command.permissions.user) {
              if (!interaction.member.permissions.has(command.permissions.user)) {
                await interaction.reply({
                  content: "You don't have enough permissions to use this command.",
                  ephemeral: true,
                });
                return;
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
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            const timeLeft = (expirationTime - now) / 1000;
            if (now < expirationTime && timeLeft > 0.9) {
              return await interaction.reply({
                content: `Please wait \`${timeLeft.toFixed(1)}\` more second(s) before reusing the **${interaction.commandName}** command.`,
              });
            }
          }

          const balanceCommands = ['balance', 'deposit', 'withdraw', 'multitransfer', 'transfer', 'buy', 'sell'];
          const gamblingCommands = ['slots', 'blackjack', 'coinflip'];
          const gameCommands = ['guessnumber'];
          const mineCommands = ['eat', 'drink', 'shop', 'inventory', 'giveitem'];
          const utilityCommands = ['avatar', 'emoji', 'language', 'qr', 'theme', 'verify'];
          const giveawaysCommands = ['giveaway', 'giveawayshopitem', 'reroll'];

          let logChannelId;
          if (giveawaysCommands.includes(interaction.commandName)) {
            logChannelId = this.client.config.logChannelId[6];
          } else if (utilityCommands.includes(interaction.commandName)) {
            logChannelId = this.client.config.logChannelId[5];
          } else if (mineCommands.includes(interaction.commandName)) {
            logChannelId = this.client.config.logChannelId[4];
          } else if (balanceCommands.includes(interaction.commandName)) {
            logChannelId = this.client.config.logChannelId[3];
          } else if (gamblingCommands.includes(interaction.commandName)) {
            logChannelId = this.client.config.logChannelId[2];
          } else if (gameCommands.includes(interaction.commandName)) {
            logChannelId = this.client.config.logChannelId[1];
          } else {
            logChannelId = this.client.config.logChannelId[0];
          }

          const channel = this.client.channels.cache.get(logChannelId);
          if (channel && channel.isTextBased()) {
            const embed = this.client.embed()
                .setColor(color.success)
                .setTitle(`Command - ${this.client.utils.formatCapitalize(interaction.commandName)}`)
                .setThumbnail(interaction.guild.iconURL({extension: 'jpeg'}))
                .addFields([
                  {
                    name: 'Author',
                    value: `**Name:** ${interaction.user.username}\n**Id:** ${interaction.user.id}\n**Channel:** ${interaction.channel.name}`,
                    inline: true,
                  },
                  {
                    name: 'Extra Guild Info',
                    value: `\`\`\`arm
[+] Name: ${interaction.guild.name}
[+] Id: ${interaction.guild.id}
[+] Members: ${interaction.guild.memberCount.toString()}
\`\`\``,
                  },
                ])
                .setFooter({
                  text: interaction.user.username,
                  iconURL: interaction.user.displayAvatarURL({extension: 'jpeg'})
                })
                .setTimestamp();
            await channel.send({embeds: [embed]}).catch(() => console.error('Error sending log message'));
          }

          await command.run(this.client, ctx, ctx.args, color, emoji, language);
        } catch (error) {
          console.error(`Error handling command ${interaction.commandName}:`, error);
          await interaction.reply({
            content: 'An error occurred while processing the command.',
            ephemeral: true,
          });
        }
      } else if (interaction instanceof ButtonInteraction && interaction.type === InteractionType.MessageComponent) {
        switch (interaction.customId) {
          case 'giveaway-join': {
            const data = await GiveawaySchema.findOne({
              guildId: interaction.guild.id,
              channelId: interaction.channel.id,
              messageId: interaction.message.id,
            });

            if (!data) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.danger)
                      .setDescription('An error occurred: Giveaway data not found.'),
                ],
                ephemeral: true,
              });
            } else if (data.endTime * 1000 < Date.now()) {
              return this.client.utils.endGiveaway(this.client, color, emoji, interaction.message);
            } else if (data.ended) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.danger)
                      .setDescription('This giveaway has already ended.'),
                ],
                ephemeral: true,
              });
            } else if (data.paused) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.danger)
                      .setDescription('This giveaway is currently paused.'),
                ],
                ephemeral: true,
              });
            } else if (data.entered.includes(interaction.user.id)) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.pink)
                      .setDescription('You are already entered in this giveaway. Would you like to leave?'),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                          .setCustomId('leave-giveaway')
                          .setLabel('Leave Giveaway')
                          .setStyle(ButtonStyle.Danger)
                  ),
                ],
                ephemeral: true,
              });

              const filter = int => int.isButton() && int.user.id === interaction.user.id;
              await interaction.channel
                  .awaitMessageComponent({filter, time: 30000})
                  .then(async int => {
                    if (int.customId === 'leave-giveaway') {
                      data.entered = data.entered.filter(id => id !== interaction.user.id);
                      await data.save();

                      await int.reply({
                        embeds: [
                          this.client.embed()
                              .setAuthor({
                                name: this.client.user.username,
                                iconURL: this.client.user.displayAvatarURL()
                              })
                              .setColor(color.main)
                              .setDescription('You have successfully left the giveaway.'),
                        ],
                        ephemeral: true,
                      });
                    } else {
                      int.deferUpdate();
                    }
                  })
                  .catch(() => {
                    console.log('No interaction collected or error occurred.');
                  });
            } else {
              data.entered.push(interaction.user.id);
              await data.save();

              await interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.main)
                      .setDescription('You have successfully joined the giveaway.'),
                ],
                ephemeral: true,
              });

              const newLabel = data.entered.length;
              await interaction.message.edit({
                components: [
                  new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                          .setCustomId('giveaway-join')
                          .setLabel(`${newLabel}`)
                          .setEmoji(`${emoji.main}`)
                          .setStyle(3),
                      new ButtonBuilder()
                          .setCustomId('giveaway-participants')
                          .setEmoji(emoji.userList)
                          .setLabel('Participants')
                          .setStyle(1)
                  ),
                ],
              });
            }
            break;
          }

          case 'giveaway-participants': {
            const data = await GiveawaySchema.findOne({
              guildId: interaction.guild.id,
              channelId: interaction.channel.id,
              messageId: interaction.message.id,
            });

            if (!data.entered.length) {
              return interaction.reply({
                content: 'No participants found.',
                ephemeral: true,
              });
            }

            const participants = await Promise.all(data.entered.map(async (id, index) => {
              let member;
              try {
                member = interaction.guild.members.cache.get(id) || await interaction.guild.members.fetch(id);
                if (!member) throw new Error("Member not found");
              } catch (err) {
                console.error(`Unable to fetch member with ID: ${id}`, err);
                return null; // Skip this participant if they are not found
              }
              return `${index + 1}. <@${id}> (**1** entry)`;
            }));

            const validParticipants = participants.filter(participant => participant !== null);

            const embed = this.client.embed()
                .setTitle('Giveaway Participants')
                .setColor(color.main)
                .setDescription(`These are the members who participated in the giveaway of **${this.client.utils.formatNumber(data.prize)}**:\n\n${validParticipants.join('\n')}\n\nTotal Participants: **${validParticipants.length}**`);

            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
          }

          case 'giveawayshopitem-join': {
            const data = await GiveawayShopItemSchema.findOne({
              guildId: interaction.guild.id,
              channelId: interaction.channel.id,
              messageId: interaction.message.id,
            });

            if (!data) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.danger)
                      .setDescription('An error occurred: Giveaway data not found.'),
                ],
                ephemeral: true,
              });
            } else if (data.endTime * 1000 < Date.now()) {
              return this.client.utils.endGiveawayShopItem(this.client, color, emoji, interaction.message);
            } else if (data.ended) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.danger)
                      .setDescription('This giveaway has already ended.'),
                ],
                ephemeral: true,
              });
            } else if (data.paused) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.danger)
                      .setDescription('This giveaway is currently paused.'),
                ],
                ephemeral: true,
              });
            } else if (data.entered.includes(interaction.user.id)) {
              return interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.pink)
                      .setDescription('You are already entered in this giveaway. Would you like to leave?'),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                          .setCustomId('leave-giveaway')
                          .setLabel('Leave Giveaway')
                          .setStyle(ButtonStyle.Danger)
                  ),
                ],
                ephemeral: true,
              });

              const filter = int => int.isButton() && int.user.id === interaction.user.id;
              await interaction.channel
                  .awaitMessageComponent({filter, time: 30000})
                  .then(async int => {
                    if (int.customId === 'leave-giveaway') {
                      data.entered = data.entered.filter(id => id !== interaction.user.id);
                      await data.save();

                      await int.reply({
                        embeds: [
                          this.client.embed()
                              .setAuthor({
                                name: this.client.user.username,
                                iconURL: this.client.user.displayAvatarURL()
                              })
                              .setColor(color.main)
                              .setDescription('You have successfully left the giveaway.'),
                        ],
                        ephemeral: true,
                      });
                    } else {
                      int.deferUpdate();
                    }
                  })
                  .catch(() => {
                    console.log('No interaction collected or error occurred.');
                  });
            } else {
              data.entered.push(interaction.user.id);
              await data.save();

              await interaction.reply({
                embeds: [
                  this.client.embed()
                      .setAuthor({name: this.client.user.username, iconURL: this.client.user.displayAvatarURL()})
                      .setColor(color.main)
                      .setDescription('You have successfully joined the giveaway.'),
                ],
                ephemeral: true,
              });

              const newLabel = data.entered.length;
              await interaction.message.edit({
                components: [
                  new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                          .setCustomId('giveawayshopitem-join')
                          .setLabel(`${newLabel}`)
                          .setEmoji(`${emoji.main}`)
                          .setStyle(3),
                      new ButtonBuilder()
                          .setCustomId('giveawayshopitem-participants')
                          .setEmoji(emoji.userList)
                          .setLabel('Participants')
                          .setStyle(1)
                  ),
                ],
              });
            }
            break;
          }

          case 'giveawayshopitem-participants': {
            const data = await GiveawayShopItemSchema.findOne({
              guildId: interaction.guild.id,
              channelId: interaction.channel.id,
              messageId: interaction.message.id,
            });

            if (!data.entered.length) {
              return interaction.reply({
                content: 'No participants found.',
                ephemeral: true,
              });
            }

            const participants = await Promise.all(data.entered.map(async (id, index) => {
              let member;
              try {
                member = interaction.guild.members.cache.get(id) || await interaction.guild.members.fetch(id);
                if (!member) throw new Error("Member not found");
              } catch (err) {
                console.error(`Unable to fetch member with ID: ${id}`, err);
                return null; // Skip this participant if they are not found
              }
              return `${index + 1}. <@${id}> (**1** entry)`;
            }));

            const validParticipants = participants.filter(participant => participant !== null);

            const embed = this.client.embed()
                .setTitle('Giveaway Shop Item Participants')
                .setColor(color.main)
                .setDescription(`These are the members who participated in the giveaway of **${this.client.utils.formatNumber(data.amount)}**:\n\n${validParticipants.join('\n')}\n\nTotal Participants: **${validParticipants.length}**`);

            await interaction.reply({ embeds: [embed], ephemeral: true });
            break;
          }

          default:
            break;
        }
      }
    })
  }
}
