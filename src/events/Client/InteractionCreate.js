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
const { Context, Event } = require('../../structures/index.js');
const GiveawaySchema = require('../../schemas/giveaway.js');
const { endGiveaway } = require('../../utils/Utils.js');
const { formatCapitalize } = require("../../utils/Utils");

module.exports = class InteractionCreate extends Event {
  constructor(client, file) {
    super(client, file, { name: 'interactionCreate' });
  }

  run(interaction) {
    this.client.setColorBasedOnTheme(interaction.user.id).then(({ user, color, emoji, language }) => {
      if (interaction instanceof CommandInteraction && interaction.type === InteractionType.ApplicationCommand) {
        const command = this.client.commands.get(interaction.commandName);
        if (!command) return;

        if (user?.verification?.isBanned) {
          return;
        }

        const now = new Date();
        if (user?.verification?.timeout?.expiresAt && user.verification.timeout.expiresAt > now) {
          const remainingTime = user.verification.timeout.expiresAt - now; // Remaining time in milliseconds

          const hours = Math.floor(remainingTime / (1000 * 60 * 60));
          const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

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

          return interaction.message.send({
            embeds: [
              this.client.embed()
                  .setColor(color.red)
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

          if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.member.send({
              content: `I don't have **\`SendMessages\`** permission in \`${interaction.guild.name}\`\nchannel: <#${interaction.channelId}>`,
            }).catch(() => {});
          }

          if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) {
            return interaction.reply({
              content: "I don't have **`EmbedLinks`** permission.",
            });
          }

          if (command.permissions) {
            if (command.permissions.client) {
              if (!interaction.guild.members.me.permissions.has(command.permissions.client)) {
                return interaction.reply({
                  content: "I don't have enough permissions to execute this command.",
                });
              }
            }
            if (command.permissions.user) {
              if (!interaction.member.permissions.has(command.permissions.user)) {
                interaction.reply({
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
              return interaction.reply({
                content: `Please wait \`${timeLeft.toFixed(1)}\` more second(s) before reusing the **${interaction.commandName}** command.`,
              });
            }
          }

          const balanceCommands = ['balance', 'deposit', 'withdraw', 'transfer', 'buy', 'sell'];
          const gamblingCommands = ['slots', 'blackjack', 'coinflip'];
          const gameCommands = ['guessnumber'];
          const mineCommands = ['eat', 'drink', 'shop', 'inventory', 'giveitem'];
          const utilityCommands = ['avatar', 'emoji', 'language', 'qr', 'theme', 'verify'];
          const giveawaysCommands = ['giveaway', 'reroll'];

          let logChannelId;
          if (giveawaysCommands.includes(command.name)) {
            logChannelId = this.client.config.logChannelId[5];
          } else if (utilityCommands.includes(command.name)) {
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
                .setColor(this.client.config.color.green)
                .setTitle(`Command - ${formatCapitalize(command.name)}`)
                .setThumbnail(interaction.guild.iconURL({ extension: 'jpeg' }))
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
                  iconURL: interaction.user.displayAvatarURL({ extension: 'jpeg' })
                })
                .setTimestamp();
            channel.send({ embeds: [embed] }).catch(() => console.error('Error sending log message'));
          }

          command.run(this.client, ctx, ctx.args, color, emoji, language);
        } catch (error) {
          console.error(`Error handling command ${interaction.commandName}:`, error);
          interaction.reply({
            content: 'An error occurred while processing the command.',
            ephemeral: true,
          });
        }
      } else if (interaction instanceof ButtonInteraction && interaction.type === InteractionType.MessageComponent) {
        this.client.utils.getGiveaway(interaction).then(data => {
          switch (interaction.customId) {
            case 'giveaway-join': {
              if (!data) {
                return interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                        .setColor(color.red)
                        .setDescription('An error occurred: Giveaway data not found.'),
                  ],
                  ephemeral: true,
                });
              } else if (data.endTime * 1000 < Date.now()) {
                return endGiveaway(this.client, color, emoji, interaction.message);
              } else if (data.ended) {
                return interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                        .setColor(color.red)
                        .setDescription('This giveaway has already ended.'),
                  ],
                  ephemeral: true,
                });
              } else if (data.paused) {
                return interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                        .setColor(color.red)
                        .setDescription('This giveaway is currently paused.'),
                  ],
                  ephemeral: true,
                });
              } else if (data.entered.includes(interaction.user.id)) {
                interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
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
                }).catch(() => {});
              } else {
                interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                        .setColor(color.green)
                        .setDescription('You have successfully entered this giveaway!'),
                  ],
                  ephemeral: true,
                }).catch(() => {});
                data.entered.push(interaction.user.id);
                GiveawaySchema.updateOne({ messageId: data.messageId }, { entered: data.entered }).catch(err => {
                  console.error(err);
                });
              }
              break;
            }
            case 'leave-giveaway': {
              if (!data) {
                return interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                        .setColor(color.red)
                        .setDescription('An error occurred: Giveaway data not found.'),
                  ],
                  ephemeral: true,
                });
              } else if (!data.entered.includes(interaction.user.id)) {
                interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                        .setColor(color.pink)
                        .setDescription('You are not currently entered in this giveaway.'),
                  ],
                  ephemeral: true,
                });
              } else {
                data.entered = data.entered.filter(id => id !== interaction.user.id);
                GiveawaySchema.updateOne({ messageId: data.messageId }, { entered: data.entered }).catch(err => {
                  console.error(err);
                });
                interaction.reply({
                  embeds: [
                    this.client.embed()
                        .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                        .setColor(color.green)
                        .setDescription('You have successfully left the giveaway!'),
                  ],
                  ephemeral: true,
                });
              }
              break;
            }
            default:
              break;
          }
        }).catch(err => {
          console.error('Error fetching giveaway data:', err);
        });
      }
    }).catch(err => {
      console.error('Error setting color:', err);
    });
  }
}
