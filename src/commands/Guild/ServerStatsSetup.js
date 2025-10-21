const Command = require("../../structures/Command.js");
const ServerStats = require("../../schemas/serverStats.js");
const {
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = class ServerStatsSetup extends Command {
  constructor(client) {
    super(client, {
      name: "serverstats",
      description: {
        content:
          "Setup server statistics channels for member count, boosts, emojis, etc.",
        examples: ["serverstats", "serverstats setup", "serverstats remove"],
        usage: "serverstats [setup|remove|list]",
      },
      category: "Guild",
      aliases: ["sstats", "stats", "serversetup"],
      cooldown: 5,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks", "ManageChannels"],
        user: ["ManageGuild"],
      },
      slashCommand: true,
      options: [
        {
          name: "action",
          description: "What action do you want to perform?",
          type: 3,
          required: false,
          choices: [
            { name: "Setup Statistics", value: "setup" },
            { name: "Remove Statistics", value: "remove" },
            { name: "List Current Stats", value: "list" },
          ],
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const action = args[0] || "menu";

    // Check if user has manage server permission
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setTitle("❌ Permission Denied")
            .setDescription(
              `${emoji.cross || "❌"} You need \`Manage Server\` permission to use this command!`
            )
            .setFooter({
              text: "Contact a server administrator for assistance",
              iconURL: client.user.displayAvatarURL(),
            }),
        ],
      });
    }

    switch (action.toLowerCase()) {
      case "setup":
        await this.handleSetup(client, ctx, color, emoji, language);
        break;
      case "remove":
        await this.handleRemove(client, ctx, color, emoji, language);
        break;
      case "list":
        await this.handleList(client, ctx, color, emoji, language);
        break;
      default:
        await this.handleMenu(client, ctx, color, emoji, language);
        break;
    }
  }

  async handleMenu(client, ctx, color, emoji, language) {
    const menuEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle("📊 Server Statistics Setup")
      .setDescription(
        `${emoji.mainLeft || "🌸"} **Welcome to Server Stats Setup!** ${emoji.mainRight || "🌸"}\n\n` +
          `Set up automatic server statistics channels that update in real-time!\n\n` +
          `**Available Statistics:**\n` +
          `👥 **Member Count** - Total server members\n` +
          `🤖 **Bot Count** - Number of bots\n` +
          `🚀 **Boost Count** - Server boost level\n` +
          `😊 **Emoji Count** - Custom emojis\n` +
          `📝 **Channel Count** - Text/Voice channels\n` +
          `📁 **Category Count** - Channel categories\n` +
          `🎭 **Role Count** - Server roles\n` +
          `🔊 **Voice Members** - Users in voice channels\n\n` +
          `**Features:**\n` +
          `✨ Real-time updates\n` +
          `🎨 Customizable format\n` +
          `📱 Mobile friendly\n` +
          `⚡ Efficient performance`
      )
      .setImage(client.config.links.banner)
      .setFooter({
        text: "Select an action below to get started!",
        iconURL: ctx.guild.iconURL() || client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const setupButton = new ButtonBuilder()
      .setCustomId("setup_stats")
      .setLabel("🔧 Setup Statistics")
      .setStyle(ButtonStyle.Primary);

    const listButton = new ButtonBuilder()
      .setCustomId("list_stats")
      .setLabel("📋 View Current")
      .setStyle(ButtonStyle.Secondary);

    const removeButton = new ButtonBuilder()
      .setCustomId("remove_stats")
      .setLabel("🗑️ Remove All")
      .setStyle(ButtonStyle.Danger);

    const helpButton = new ButtonBuilder()
      .setCustomId("help_stats")
      .setLabel("❓ Help")
      .setStyle(ButtonStyle.Success);

    const row = client.utils.createButtonRow(
      setupButton,
      listButton,
      removeButton,
      helpButton
    );

    const replyMessage = await ctx.sendMessage({
      embeds: [menuEmbed],
      components: [row],
      fetchReply: true,
    });

    // Handle button interactions
    const collector = replyMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === ctx.author.id,
      time: 300000, // 5 minutes
    });

    collector.on("collect", async (interaction) => {
      try {
        await interaction.deferUpdate();

        switch (interaction.customId) {
          case "setup_stats":
            await this.handleSetup(
              client,
              { ...ctx, sendMessage: (opts) => interaction.editReply(opts) },
              color,
              emoji,
              language
            );
            break;
          case "list_stats":
            await this.handleList(
              client,
              { ...ctx, sendMessage: (opts) => interaction.editReply(opts) },
              color,
              emoji,
              language
            );
            break;
          case "remove_stats":
            await this.handleRemove(
              client,
              { ...ctx, sendMessage: (opts) => interaction.editReply(opts) },
              color,
              emoji,
              language
            );
            break;
          case "help_stats":
            await this.showHelp(
              client,
              { ...ctx, sendMessage: (opts) => interaction.editReply(opts) },
              color,
              emoji,
              language
            );
            break;
        }
      } catch (error) {
        console.error("Button interaction error:", error);
      }
    });

    collector.on("end", () => {
      replyMessage.edit({ components: [] }).catch(() => {});
    });
  }

  async handleSetup(client, ctx, color, emoji, language) {
    const statsOptions = [
      {
        label: "👥 Member Count",
        value: "members",
        description: "Total server members",
        format: "👥 Members: {count}",
      },
      {
        label: "🤖 Bot Count",
        value: "bots",
        description: "Number of bots in server",
        format: "🤖 Bots: {count}",
      },
      {
        label: "🚀 Boost Count",
        value: "boosts",
        description: "Server boost level and count",
        format: "🚀 Boosts: {count}",
      },
      {
        label: "😊 Emoji Count",
        value: "emojis",
        description: "Custom server emojis",
        format: "😊 Emojis: {count}",
      },
      {
        label: "📝 Text Channels",
        value: "textchannels",
        description: "Number of text channels",
        format: "📝 Text: {count}",
      },
      {
        label: "🔊 Voice Channels",
        value: "voicechannels",
        description: "Number of voice channels",
        format: "🔊 Voice: {count}",
      },
      {
        label: "📁 Categories",
        value: "categories",
        description: "Channel categories",
        format: "📁 Categories: {count}",
      },
      {
        label: "🎭 Roles",
        value: "roles",
        description: "Server roles count",
        format: "🎭 Roles: {count}",
      },
      {
        label: "🔊 Voice Members",
        value: "voicemembers",
        description: "Users currently in voice",
        format: "🔊 In Voice: {count}",
      },
      {
        label: "👤 Humans Only",
        value: "humans",
        description: "Members excluding bots",
        format: "👤 Humans: {count}",
      },
    ];

    const setupEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle("🔧 Setup Server Statistics")
      .setDescription(
        `**Select the statistics you want to create:**\n\n` +
          `Each selected option will create a voice channel that automatically updates with real-time statistics.\n\n` +
          `**Current Server Stats:**\n` +
          `👥 Members: ${ctx.guild.memberCount}\n` +
          `🤖 Bots: ${ctx.guild.members.cache.filter((m) => m.user.bot).size}\n` +
          `🚀 Boosts: ${ctx.guild.premiumSubscriptionCount || 0}\n` +
          `😊 Emojis: ${ctx.guild.emojis.cache.size}\n` +
          `📝 Text Channels: ${ctx.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size}\n` +
          `🔊 Voice Channels: ${ctx.guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size}\n` +
          `📁 Categories: ${ctx.guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size}\n` +
          `🎭 Roles: ${ctx.guild.roles.cache.size}\n\n` +
          `💡 **Tip:** You can select multiple statistics at once!`
      )
      .setFooter({
        text: "Select from the dropdown menu below",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("stats_select")
      .setPlaceholder("🎯 Choose statistics to setup...")
      .setMinValues(1)
      .setMaxValues(statsOptions.length)
      .addOptions(statsOptions);

    const row = client.utils.createButtonRow(selectMenu);

    const replyMessage = await ctx.sendMessage({
      embeds: [setupEmbed],
      components: [row],
      fetchReply: true,
    });

    const collector = replyMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === ctx.author.id,
      time: 300000,
    });

    collector.on("collect", async (interaction) => {
      try {
        await interaction.deferUpdate();
        const selectedStats = interaction.values;

        // Create a category for stats channels
        let category = ctx.guild.channels.cache.find(
          (c) =>
            c.type === ChannelType.GuildCategory &&
            c.name.toLowerCase().includes("server stats")
        );

        if (!category) {
          category = await ctx.guild.channels.create({
            name: "📊 Server Statistics",
            type: ChannelType.GuildCategory,
            reason: "Server Statistics Setup by " + ctx.author.tag,
          });
        }

        const createdChannels = [];
        const errors = [];

        // Create channels for each selected stat
        for (const statType of selectedStats) {
          try {
            const statOption = statsOptions.find(
              (opt) => opt.value === statType
            );
            const currentValue = await this.getStatValue(ctx.guild, statType);
            const channelName = statOption.format.replace(
              "{count}",
              currentValue
            );

            const channel = await ctx.guild.channels.create({
              name: channelName,
              type: ChannelType.GuildVoice,
              parent: category,
              permissionOverwrites: [
                {
                  id: ctx.guild.id,
                  deny: [PermissionFlagsBits.Connect],
                },
              ],
              reason: `Server Statistics Setup - ${statOption.label}`,
            });

            createdChannels.push({
              channel,
              type: statType,
              format: statOption.format,
            });
          } catch (error) {
            errors.push(
              `${statsOptions.find((opt) => opt.value === statType)?.label}: ${error.message}`
            );
          }
        }

        // Save to database
        await this.saveStatsChannels(
          ctx.guild.id,
          createdChannels,
          category.id,
          ctx.author.id
        );

        const resultEmbed = client
          .embed()
          .setColor(createdChannels.length > 0 ? color.success : color.danger)
          .setTitle(
            createdChannels.length > 0
              ? "✅ Statistics Channels Created!"
              : "❌ Setup Failed"
          )
          .setDescription(
            createdChannels.length > 0
              ? `Successfully created **${createdChannels.length}** statistics channels!\n\n` +
                  `**Created Channels:**\n` +
                  createdChannels
                    .map(({ channel, type }) => `• ${channel} (${type})`)
                    .join("\n") +
                  `\n\n🔄 Channels will update automatically!\n` +
                  `📁 Category: ${category}`
              : "Failed to create any statistics channels. Check permissions and try again."
          )
          .setFooter({
            text: "Statistics will update every 10 minutes",
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        if (errors.length > 0) {
          resultEmbed.addFields([
            {
              name: "⚠️ Errors",
              value: errors.join("\n"),
              inline: false,
            },
          ]);
        }

        await interaction.editReply({ embeds: [resultEmbed], components: [] });

        // The ServerStatsManager will automatically handle updates
      } catch (error) {
        console.error("Setup error:", error);
        const errorEmbed = client
          .embed()
          .setColor(color.danger)
          .setTitle("❌ Setup Error")
          .setDescription(`An error occurred during setup: ${error.message}`)
          .setFooter({
            text: "Please try again or contact support",
            iconURL: client.user.displayAvatarURL(),
          });

        await interaction.editReply({ embeds: [errorEmbed], components: [] });
      }
    });

    collector.on("end", () => {
      replyMessage.edit({ components: [] }).catch(() => {});
    });
  }

  async handleList(client, ctx, color, emoji, language) {
    // Get saved stats channels from database
    const statsChannels = await this.getStatsChannels(ctx.guild.id);

    if (!statsChannels || statsChannels.length === 0) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.warning)
            .setTitle("📋 No Statistics Setup")
            .setDescription(
              `${emoji.cross || "❌"} No server statistics are currently configured.\n\n` +
                `Use \`${client.prefix}serverstats setup\` to get started!`
            )
            .setFooter({
              text: "Setup statistics to track your server metrics",
              iconURL: client.user.displayAvatarURL(),
            }),
        ],
      });
    }

    const listEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle("📋 Current Server Statistics")
      .setDescription(
        `**Active Statistics Channels:**\n\n` +
          statsChannels
            .map((stat) => {
              const channel = ctx.guild.channels.cache.get(stat.channelId);
              return channel
                ? `• ${channel} - ${stat.type}`
                : `• ~~${stat.type}~~ (Channel deleted)`;
            })
            .join("\n") +
          `\n\n🔄 **Last Updated:** ${new Date().toLocaleString()}\n` +
          `⚡ **Update Frequency:** Every 10 minutes\n` +
          `📊 **Total Channels:** ${statsChannels.length}`
      )
      .setFooter({
        text: "Use 'remove' to delete statistics channels",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await ctx.sendMessage({ embeds: [listEmbed] });
  }

  async handleRemove(client, ctx, color, emoji, language) {
    const statsChannels = await this.getStatsChannels(ctx.guild.id);

    if (!statsChannels || statsChannels.length === 0) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.warning)
            .setTitle("🗑️ Nothing to Remove")
            .setDescription(
              `${emoji.cross || "❌"} No server statistics channels found to remove.`
            )
            .setFooter({
              text: "Use 'setup' to create statistics channels",
              iconURL: client.user.displayAvatarURL(),
            }),
        ],
      });
    }

    const confirmEmbed = client
      .embed()
      .setColor(color.warning)
      .setTitle("⚠️ Confirm Removal")
      .setDescription(
        `Are you sure you want to remove **${statsChannels.length}** statistics channels?\n\n` +
          `**This will delete:**\n` +
          statsChannels
            .map((stat) => {
              const channel = ctx.guild.channels.cache.get(stat.channelId);
              return channel
                ? `• ${channel.name}`
                : `• ${stat.type} (already deleted)`;
            })
            .join("\n") +
          `\n\n❌ **This action cannot be undone!**`
      )
      .setFooter({
        text: "Click confirm to proceed with deletion",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm_remove")
      .setLabel("✅ Confirm Removal")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_remove")
      .setLabel("❌ Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = client.utils.createButtonRow(confirmButton, cancelButton);

    const replyMessage = await ctx.sendMessage({
      embeds: [confirmEmbed],
      components: [row],
      fetchReply: true,
    });

    const collector = replyMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === ctx.author.id,
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      try {
        await interaction.deferUpdate();

        if (interaction.customId === "confirm_remove") {
          let deletedCount = 0;
          const errors = [];

          // Delete all statistics channels
          for (const stat of statsChannels) {
            try {
              const channel = ctx.guild.channels.cache.get(stat.channelId);
              if (channel) {
                await channel.delete(
                  "Statistics channels removed by " + ctx.author.tag
                );
                deletedCount++;
              }
            } catch (error) {
              errors.push(`Failed to delete ${stat.type}: ${error.message}`);
            }
          }

          // Remove from database
          await this.removeStatsChannels(ctx.guild.id);

          const resultEmbed = client
            .embed()
            .setColor(deletedCount > 0 ? color.success : color.danger)
            .setTitle(
              deletedCount > 0 ? "✅ Statistics Removed" : "❌ Removal Failed"
            )
            .setDescription(
              deletedCount > 0
                ? `Successfully removed **${deletedCount}** statistics channels!`
                : "Failed to remove statistics channels."
            )
            .setFooter({
              text: "Statistics channels have been cleaned up",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp();

          if (errors.length > 0) {
            resultEmbed.addFields([
              {
                name: "⚠️ Errors",
                value: errors.join("\n"),
                inline: false,
              },
            ]);
          }

          await interaction.editReply({
            embeds: [resultEmbed],
            components: [],
          });
        } else {
          const cancelEmbed = client
            .embed()
            .setColor(color.main)
            .setTitle("❌ Removal Cancelled")
            .setDescription("Statistics channels removal has been cancelled.")
            .setFooter({
              text: "No changes were made",
              iconURL: client.user.displayAvatarURL(),
            });

          await interaction.editReply({
            embeds: [cancelEmbed],
            components: [],
          });
        }
      } catch (error) {
        console.error("Remove error:", error);
      }
    });

    collector.on("end", () => {
      replyMessage.edit({ components: [] }).catch(() => {});
    });
  }

  async showHelp(client, ctx, color, emoji, language) {
    const helpEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle("❓ Server Statistics Help")
      .setDescription(
        `**What are Server Statistics?**\n` +
          `Server statistics are voice channels that display real-time information about your server, such as member count, boost level, etc.\n\n` +
          `**Commands:**\n` +
          `• \`${client.prefix}serverstats setup\` - Setup new statistics\n` +
          `• \`${client.prefix}serverstats list\` - View current statistics\n` +
          `• \`${client.prefix}serverstats remove\` - Remove all statistics\n\n` +
          `**Available Statistics:**\n` +
          `👥 **Members** - Total server members\n` +
          `🤖 **Bots** - Number of bots\n` +
          `🚀 **Boosts** - Server boost count\n` +
          `😊 **Emojis** - Custom emoji count\n` +
          `📝 **Channels** - Text/Voice channels\n` +
          `📁 **Categories** - Channel categories\n` +
          `🎭 **Roles** - Server roles\n` +
          `🔊 **Voice Members** - Users in voice\n\n` +
          `**Features:**\n` +
          `✅ Real-time updates every 10 minutes\n` +
          `✅ Automatic channel management\n` +
          `✅ Customizable formats\n` +
          `✅ Permission protection\n\n` +
          `**Requirements:**\n` +
          `• Bot needs \`Manage Channels\` permission\n` +
          `• User needs \`Manage Server\` permission`
      )
      .setFooter({
        text: "Need more help? Contact server administrators",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await ctx.sendMessage({ embeds: [helpEmbed] });
  }

  // Helper methods for database operations
  async saveStatsChannels(guildId, channels, categoryId, userId) {
    try {
      const channelData = channels.map(({ channel, type, format }) => ({
        channelId: channel.id,
        type,
        format,
        isActive: true,
        lastUpdated: new Date(),
      }));

      await ServerStats.findOneAndUpdate(
        { guildId },
        {
          guildId,
          categoryId,
          channels: channelData,
          "statistics.createdBy": userId,
          "statistics.createdAt": new Date(),
        },
        { upsert: true, new: true }
      );

      console.log(
        `Saved ${channels.length} stats channels for guild ${guildId}`
      );
    } catch (error) {
      console.error("Error saving stats channels:", error);
      throw error;
    }
  }

  async getStatsChannels(guildId) {
    try {
      const serverStats = await ServerStats.findOne({ guildId });
      return serverStats ? serverStats.channels : [];
    } catch (error) {
      console.error("Error getting stats channels:", error);
      return [];
    }
  }

  async removeStatsChannels(guildId) {
    try {
      await ServerStats.deleteOne({ guildId });
      console.log(`Removed stats channels for guild ${guildId}`);
    } catch (error) {
      console.error("Error removing stats channels:", error);
      throw error;
    }
  }

  async getStatValue(guild, statType) {
    switch (statType) {
      case "members":
        return guild.memberCount.toString();
      case "bots":
        return guild.members.cache.filter((m) => m.user.bot).size.toString();
      case "humans":
        return guild.members.cache.filter((m) => !m.user.bot).size.toString();
      case "boosts":
        return (guild.premiumSubscriptionCount || 0).toString();
      case "emojis":
        return guild.emojis.cache.size.toString();
      case "textchannels":
        return guild.channels.cache
          .filter((c) => c.type === ChannelType.GuildText)
          .size.toString();
      case "voicechannels":
        return guild.channels.cache
          .filter((c) => c.type === ChannelType.GuildVoice)
          .size.toString();
      case "categories":
        return guild.channels.cache
          .filter((c) => c.type === ChannelType.GuildCategory)
          .size.toString();
      case "roles":
        return guild.roles.cache.size.toString();
      case "voicemembers":
        return guild.members.cache
          .filter((m) => m.voice.channel)
          .size.toString();
      default:
        return "0";
    }
  }
};
