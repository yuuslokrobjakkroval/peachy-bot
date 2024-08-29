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
const GiveawaySchema = require('../../schemas/Giveaway.js');
const { endGiveaway } = require('../../utils/Utils.js');

class InteractionCreate extends Event {
  constructor(client, file) {
    super(client, file, { name: 'interactionCreate' });
  }

  async run(interaction) {
    if (interaction instanceof CommandInteraction && interaction.type === InteractionType.ApplicationCommand) {
      const command = this.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        const ctx = new Context(interaction, interaction.options.data);
        ctx.setArgs(interaction.options.data);

        if (!interaction.inGuild()) return;

        const isRestrictedCommand = ['giveaway', 'level-setup', 'level-message', 'level-disable']
        const hasDevRole = interaction.member.roles.cache.some(role => role.name === 'Developer');
        const isOwner = this.client.config.owners.includes(interaction.user.id);

        if (isRestrictedCommand.includes(interaction.commandName) && !(isOwner || hasDevRole)) {
          return await interaction.reply({
            content: "You don't have permission to use this command.",
            ephemeral: true,
          });
        }

        if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) {
          return;
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) {
          return await interaction.member.send({
            content: `I don't have **\`SendMessages\`** permission in \`${interaction.guild.name}\`\nchannel: <#${interaction.channelId}>`,
          }).catch(() => {});
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

        await command.run(this.client, ctx, ctx.args);
      } catch (error) {
        console.error(`Error handling command ${interaction.commandName}:`, error);
        await interaction.reply({
          content: 'An error occurred while processing the command.',
          ephemeral: true,
        });
      }
    }

    else if (interaction instanceof ButtonInteraction && interaction.type === InteractionType.MessageComponent) {
      switch (interaction.customId) {
        case 'giveaway-join': {
          const data = await GiveawaySchema.findOne({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: interaction.message.id,
          });

          if (!data) {
            return await interaction.reply({
              embeds: [
                this.client.embed()
                    .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                    .setColor(this.client.color.red)
                    .setDescription('An error occurred: Giveaway data not found.'),
              ],
              ephemeral: true,
            });
          } else if (data.endTime * 1000 < Date.now()) {
            return endGiveaway(this.client, interaction.message);
          } else if (data.ended) {
            return await interaction.reply({
              embeds: [
                this.client.embed()
                    .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                    .setColor(this.client.color.red)
                    .setDescription('This giveaway has already ended.'),
              ],
              ephemeral: true,
            });
          } else if (data.paused) {
            return await interaction.reply({
              embeds: [
                this.client.embed()
                    .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                    .setColor(this.client.color.red)
                    .setDescription('This giveaway is currently paused.'),
              ],
              ephemeral: true,
            });
          } else if (data.entered.includes(interaction.user.id)) {
            await interaction.reply({
              embeds: [
                this.client.embed()
                    .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                    .setColor(this.client.color.yellow)
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

            // Collect button interaction
            const filter = int => int.isButton() && int.user.id === interaction.user.id;
            interaction.channel
                .awaitMessageComponent({ filter, time: 30000 })
                .then(async int => {
                  if (int.customId === 'leave-giveaway') {
                    data.entered = data.entered.filter(id => id !== interaction.user.id);
                    await data.save();

                    await int.reply({
                      embeds: [
                        this.client.embed()
                            .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                            .setColor(this.client.color.main)
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
                    .setAuthor({ name: this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                    .setColor(this.client.color.main)
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
                        .setEmoji('<a:Dom:1264200823542517812>')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('giveaway-participants')
                        .setEmoji(this.client.emote.userlist)
                        .setLabel('Participants')
                        .setStyle(ButtonStyle.Primary)
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
            return await interaction.reply({
              content: 'No participants found.',
              ephemeral: true,
            });
          }

          const participants = data.entered
              .map((id, index) => `${index + 1}. ${this.client.users.cache.get(id)?.username || 'Unknown User'} (**1** entry)`)
              .join('\n');

          const embed = this.client.embed()
              .setTitle('Giveaway Participants')
              .setColor(this.client.color.main)
              .setDescription(`These are the members who participated in the giveaway of **${data.prize}**:\n\n${participants}\n\nTotal Participants: **${data.entered.length}**`);

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        default:
          break;
      }
    }
  }
}

module.exports = InteractionCreate;
