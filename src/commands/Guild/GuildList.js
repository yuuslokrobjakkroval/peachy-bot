const { Command } = require("../../structures/index.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");

module.exports = class GuildList extends Command {
  constructor(client) {
    super(client, {
      name: "guildlist",
      description: {
        content: "List all guilds the bot is in",
        examples: ["guildlist"],
        usage: "guildlist",
      },
      category: "guild",
      aliases: ["glt"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: true,
        staff: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "search",
          description: "Search for guilds by name",
          type: 3,
          required: false,
        },
        {
          name: "sort",
          description: "Sort guilds by different criteria",
          type: 3,
          required: false,
          choices: [
            { name: "Name (A-Z)", value: "name_asc" },
            { name: "Name (Z-A)", value: "name_desc" },
            { name: "Member Count (High-Low)", value: "members_desc" },
            { name: "Member Count (Low-High)", value: "members_asc" },
            { name: "Join Date (Newest)", value: "joined_desc" },
            { name: "Join Date (Oldest)", value: "joined_asc" },
          ],
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    // Ensure color object exists with fallbacks
    const safeColor = {
      main: color?.main || "#7289da",
      success: color?.success || "#00ff00",
      danger: color?.danger || "#ff0000",
      warning: color?.warning || "#ffff00",
    };

    try {
      // Get search and sort parameters
      const searchQuery = ctx.isInteraction
        ? ctx.interaction.options.getString("search")
        : args.find((arg) => arg.startsWith("search:"))?.split(":")[1];

      const sortOption = ctx.isInteraction
        ? ctx.interaction.options.getString("sort") || "name_asc"
        : args.find((arg) => arg.startsWith("sort:"))?.split(":")[1] ||
          "name_asc";

      return this.showGuildList(
        client,
        ctx,
        safeColor,
        emoji,
        searchQuery,
        sortOption
      );
    } catch (error) {
      console.error("Error in GuildList command:", error);
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(safeColor.danger)
            .setTitle("❌ Error")
            .setDescription(
              "An error occurred while fetching guild information."
            ),
        ],
      });
    }
  }

  async showGuildList(
    client,
    ctx,
    color,
    emoji,
    searchQuery = null,
    sortOption = "name_asc"
  ) {
    const guilds = Array.from(client.guilds.cache.values());

    // Filter guilds by search query if provided
    let filteredGuilds = guilds;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredGuilds = guilds.filter(
        (guild) =>
          guild.name.toLowerCase().includes(query) || guild.id.includes(query)
      );
    }

    // Sort guilds based on selected option
    const sortedGuilds = this.sortGuilds(filteredGuilds, sortOption);

    if (sortedGuilds.length === 0) {
      const noResultsEmbed = client
        .embed()
        .setColor(color.warning)
        .setTitle("🔍 No Guilds Found")
        .setDescription(
          searchQuery
            ? `No guilds found matching "**${searchQuery}**"`
            : "No guilds found."
        )
        .addFields([
          {
            name: "💡 Search Tips",
            value:
              "• Try searching by guild name\n• Use partial names for broader results\n• Search by guild ID for exact matches",
            inline: false,
          },
        ]);

      return ctx.sendMessage({ embeds: [noResultsEmbed] });
    }

    // Pagination setup
    const itemsPerPage = 5;
    const totalPages = Math.ceil(sortedGuilds.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const startIndex = page * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, sortedGuilds.length);
      const pageGuilds = sortedGuilds.slice(startIndex, endIndex);

      const embed = client
        .embed()
        .setColor(color.main)
        .setAuthor({
          name: `${client.user.displayName} Guild List`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(
          `🏰 Guild List ${searchQuery ? `- Search: "${searchQuery}"` : ""}`
        )
        .setDescription(
          `📊 **Statistics:**\n` +
            `🔢 **Total Guilds:** ${guilds.length.toLocaleString()}\n` +
            `🔍 **Showing:** ${sortedGuilds.length.toLocaleString()} guilds\n` +
            `👥 **Total Members:** ${guilds.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}\n` +
            `📄 **Page:** ${page + 1}/${totalPages}\n\n` +
            `**Sort:** ${this.getSortDisplayName(sortOption)}`
        );

      pageGuilds.forEach((guild, index) => {
        const guildNumber = startIndex + index + 1;
        const joinedDate = guild.joinedAt
          ? `<t:${Math.floor(guild.joinedAt.getTime() / 1000)}:R>`
          : "Unknown";
        const owner = guild.members.cache.get(guild.ownerId) || {
          user: { tag: "Unknown" },
        };

        embed.addFields([
          {
            name: `${guildNumber}. ${guild.name}`,
            value:
              `🆔 **ID:** \`${guild.id}\`\n` +
              `👥 **Members:** ${guild.memberCount.toLocaleString()}\n` +
              `👑 **Owner:** ${owner.user.tag}\n` +
              `📅 **Joined:** ${joinedDate}`,
            inline: false,
          },
        ]);
      });

      embed.setFooter({
        text: `💡 Use the buttons below to navigate and interact with guilds • Page ${page + 1}/${totalPages}`,
        iconURL: ctx.author.displayAvatarURL(),
      });

      return embed;
    };

    const generateComponents = (page, isExpired = false) => {
      const guildSelectOptions = [];
      const startIndex = page * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, sortedGuilds.length);
      const pageGuilds = sortedGuilds.slice(startIndex, endIndex);

      pageGuilds.forEach((guild, index) => {
        const guildNumber = startIndex + index + 1;
        guildSelectOptions.push({
          label:
            guild.name.length > 25
              ? guild.name.substring(0, 22) + "..."
              : guild.name,
          description: `ID: ${guild.id} • ${guild.memberCount} members`,
          value: `guild_${guild.id}`,
          emoji: "🏰",
        });
      });

      const components = [];

      // Guild selection dropdown
      if (guildSelectOptions.length > 0 && !isExpired) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("guild_select")
          .setPlaceholder("🏰 Select a guild to view details and copy ID...")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(guildSelectOptions);

        components.push(new ActionRowBuilder().addComponents(selectMenu));
      }

      // Navigation and utility buttons
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("first_page")
          .setLabel("⏮️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0 || isExpired),
        new ButtonBuilder()
          .setCustomId("prev_page")
          .setLabel("◀️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0 || isExpired),
        new ButtonBuilder()
          .setCustomId("page_info")
          .setLabel(`${page + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("▶️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages - 1 || isExpired),
        new ButtonBuilder()
          .setCustomId("last_page")
          .setLabel("⏭️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages - 1 || isExpired)
      );

      // Utility buttons row
      const utilityRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("refresh")
          .setLabel("🔄 Refresh")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(isExpired),
        new ButtonBuilder()
          .setCustomId("search")
          .setLabel("🔍 Search")
          .setStyle(ButtonStyle.Success)
          .setDisabled(isExpired),
        new ButtonBuilder()
          .setCustomId("sort")
          .setLabel("📊 Sort")
          .setStyle(ButtonStyle.Success)
          .setDisabled(isExpired),
        new ButtonBuilder()
          .setCustomId("export")
          .setLabel("📤 Export")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(isExpired)
      );

      components.push(buttonRow, utilityRow);
      return components;
    };

    // Send initial message
    const message = await ctx.sendMessage({
      embeds: [generateEmbed(currentPage)],
      components: generateComponents(currentPage),
    });

    // Create collector for interactions
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 300000, // 5 minutes
    });

    collector.on("collect", async (interaction) => {
      try {
        await interaction.deferUpdate();

        if (interaction.customId === "first_page") {
          currentPage = 0;
        } else if (interaction.customId === "prev_page") {
          currentPage = Math.max(0, currentPage - 1);
        } else if (interaction.customId === "next_page") {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        } else if (interaction.customId === "last_page") {
          currentPage = totalPages - 1;
        } else if (interaction.customId === "refresh") {
          // Refresh the guild list
          return this.showGuildList(
            client,
            {
              sendMessage: (data) => interaction.editReply(data),
              author: ctx.author,
            },
            color,
            emoji,
            searchQuery,
            sortOption
          );
        } else if (interaction.customId === "search") {
          const searchEmbed = client
            .embed()
            .setColor(color.main)
            .setTitle("🔍 Guild Search")
            .setDescription(
              "**How to search:**\n" +
                "• Use `/guildlist search:<query>` to search by name\n" +
                "• Use `/guildlist search:<guild_id>` to find by ID\n" +
                "• Examples:\n" +
                "  - `/guildlist search:discord`\n" +
                "  - `/guildlist search:123456789012345678`"
            );

          return interaction.followUp({
            embeds: [searchEmbed],
          });
        } else if (interaction.customId === "sort") {
          const sortEmbed = client
            .embed()
            .setColor(color.main)
            .setTitle("📊 Guild Sorting")
            .setDescription(
              "**Available sort options:**\n" +
                "• `name_asc` - Name (A-Z)\n" +
                "• `name_desc` - Name (Z-A)\n" +
                "• `members_desc` - Member Count (High-Low)\n" +
                "• `members_asc` - Member Count (Low-High)\n" +
                "• `joined_desc` - Join Date (Newest)\n" +
                "• `joined_asc` - Join Date (Oldest)\n\n" +
                "**Usage:** `/guildlist sort:<option>`"
            );

          return interaction.followUp({ embeds: [sortEmbed] });
        } else if (interaction.customId === "export") {
          const exportData = sortedGuilds.map((guild) => ({
            name: guild.name,
            id: guild.id,
            owner: guild.ownerId,
          }));

          const exportText =
            `Guild List Export (${new Date().toISOString()})\n` +
            `Total Guilds: ${exportData.length}\n\n` +
            exportData
              .map(
                (g, i) =>
                  `${i + 1}. ${g.name}\n   ID: ${g.id}\n   Members: ${g.members}\n`
              )
              .join("\n");

          return interaction.followUp({
            content: `\`\`\`\n${exportText.slice(0, 1900)}\n\`\`\``,
          });
        } else if (interaction.customId === "guild_select") {
          const guildId = interaction.values[0].replace("guild_", "");
          const guild = client.guilds.cache.get(guildId);

          if (guild) {
            return this.showGuildDetails(interaction, client, guild, color);
          }
        }

        // Update the message with new page
        await interaction.editReply({
          embeds: [generateEmbed(currentPage)],
          components: generateComponents(currentPage),
        });
      } catch (error) {
        console.error("Error handling interaction:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ An error occurred!",
          });
        }
      }
    });

    collector.on("end", async () => {
      try {
        await message.edit({
          embeds: [generateEmbed(currentPage)],
          components: generateComponents(currentPage, true),
        });
      } catch (error) {
        console.error("Error updating message on collector end:", error);
      }
    });
  }

  async showGuildDetails(interaction, client, guild, color) {
    const owner = await guild.fetchOwner().catch(() => null);
    const channels = guild.channels.cache;
    const roles = guild.roles.cache;
    const emojis = guild.emojis.cache;

    const detailEmbed = client
      .embed()
      .setColor(color.main)
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ size: 256 }) || client.user.displayAvatarURL(),
      })
      .setTitle("🏰 Guild Details")
      .setThumbnail(
        guild.iconURL({ size: 256 }) || client.user.displayAvatarURL()
      )
      .addFields([
        {
          name: "🆔 Guild Information",
          value:
            `**Name:** ${guild.name}\n` +
            `**ID:** \`${guild.id}\`\n` +
            `**Description:** ${guild.description || "None"}\n` +
            `**Verification Level:** ${this.getVerificationLevel(guild.verificationLevel)}\n` +
            `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: false,
        },
        {
          name: "👑 Owner & Management",
          value:
            `**Owner:** ${owner ? `${owner.user.tag} (\`${owner.user.id}\`)` : "Unknown"}\n` +
            `**Joined:** ${guild.joinedAt ? `<t:${Math.floor(guild.joinedAt.getTime() / 1000)}:F>` : "Unknown"}\n` +
            `**Bot Permissions:** ${guild.members.me?.permissions.has("Administrator") ? "Administrator" : "Limited"}`,
          inline: false,
        },
        {
          name: "👥 Members & Activity",
          value:
            `**Total Members:** ${guild.memberCount.toLocaleString()}\n` +
            `**Max Members:** ${guild.maximumMembers?.toLocaleString() || "Unknown"}\n` +
            `**Approximate Presence:** ${guild.approximatePresenceCount?.toLocaleString() || "Unknown"}\n` +
            `**Premium Tier:** ${guild.premiumTier}\n` +
            `**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
          inline: false,
        },
        {
          name: "📊 Server Statistics",
          value:
            `**Channels:** ${channels.size} (Text: ${channels.filter((c) => c.type === 0).size}, Voice: ${channels.filter((c) => c.type === 2).size})\n` +
            `**Roles:** ${roles.size}\n` +
            `**Emojis:** ${emojis.size}\n` +
            `**Stickers:** ${guild.stickers.cache.size}`,
          inline: false,
        },
      ])
      .setFooter({
        text: "💡 Click the button below to copy the Guild ID",
        iconURL: interaction.user.displayAvatarURL(),
      });

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copy_id_${guild.id}`)
        .setLabel(`📋 Copy ID: ${guild.id}`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("back_to_list")
        .setLabel("← Back to List")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`visit_guild_${guild.id}`)
        .setLabel("🔗 Guild Info")
        .setStyle(ButtonStyle.Primary)
    );

    const detailMessage = await interaction.followUp({
      embeds: [detailEmbed],
      components: [actionRow],
    });

    // Create collector for guild detail buttons
    const detailCollector = detailMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 300000, // 5 minutes
    });

    detailCollector.on("collect", async (detailInteraction) => {
      try {
        if (detailInteraction.customId.startsWith("copy_id_")) {
          const guildId = detailInteraction.customId.replace("copy_id_", "");
          await detailInteraction.reply({
            content: `📋 **Guild ID copied!**\n\`\`\`\n${guildId}\n\`\`\`\n*You can now paste this ID wherever you need it.*`,
            flags: 64,
          });
        } else if (detailInteraction.customId === "back_to_list") {
          await detailInteraction.deferUpdate();
          detailCollector.stop();
          await detailMessage.delete().catch(() => {});
          // The original list message should still be visible
        } else if (detailInteraction.customId.startsWith("visit_guild_")) {
          const guildId = detailInteraction.customId.replace(
            "visit_guild_",
            ""
          );
          const targetGuild = client.guilds.cache.get(guildId);

          if (targetGuild) {
            const invites = await targetGuild.invites
              .fetch()
              .catch(() => new Map());
            const invite =
              invites.find((inv) => !inv.temporary && inv.maxAge === 0) ||
              invites.first();

            const guildInfoEmbed = client
              .embed()
              .setColor(color.main)
              .setTitle(`🔗 Guild Information - ${targetGuild.name}`)
              .setDescription(
                `**Guild ID:** \`${targetGuild.id}\`\n` +
                  `**Members:** ${targetGuild.memberCount.toLocaleString()}\n` +
                  `**Created:** <t:${Math.floor(targetGuild.createdTimestamp / 1000)}:F>\n\n` +
                  (invite
                    ? `**Invite Link:** https://discord.gg/${invite.code}`
                    : "**No public invites available**")
              )
              .setThumbnail(
                targetGuild.iconURL({ size: 256 }) ||
                  client.user.displayAvatarURL()
              )
              .setFooter({
                text: "💡 Use this information to visit or manage the guild",
              });

            await detailInteraction.reply({
              embeds: [guildInfoEmbed],
              flags: 64,
            });
          } else {
            await detailInteraction.reply({
              content: "❌ Guild not found or bot no longer has access to it.",
              flags: 64,
            });
          }
        }
      } catch (error) {
        console.error("Error handling guild detail interaction:", error);
        if (!detailInteraction.replied && !detailInteraction.deferred) {
          await detailInteraction.reply({
            content: "❌ An error occurred while processing your request!",
            flags: 64,
          });
        }
      }
    });

    detailCollector.on("end", async () => {
      try {
        const disabledActionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`copy_id_${guild.id}`)
            .setLabel(`📋 Copy ID: ${guild.id}`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("back_to_list")
            .setLabel("← Back to List")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`visit_guild_${guild.id}`)
            .setLabel("🔗 Guild Info")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        await detailMessage
          .edit({
            embeds: [detailEmbed],
            components: [disabledActionRow],
          })
          .catch(() => {});
      } catch (error) {
        console.error("Error disabling guild detail buttons:", error);
      }
    });
  }

  sortGuilds(guilds, sortOption) {
    return guilds.sort((a, b) => {
      switch (sortOption) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "members_desc":
          return b.memberCount - a.memberCount;
        case "members_asc":
          return a.memberCount - b.memberCount;
        case "joined_desc":
          return (b.joinedAt?.getTime() || 0) - (a.joinedAt?.getTime() || 0);
        case "joined_asc":
          return (a.joinedAt?.getTime() || 0) - (b.joinedAt?.getTime() || 0);
        case "name_asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  getSortDisplayName(sortOption) {
    const sortNames = {
      name_asc: "Name (A-Z)",
      name_desc: "Name (Z-A)",
      members_desc: "Members (High-Low)",
      members_asc: "Members (Low-High)",
      joined_desc: "Join Date (Newest)",
      joined_asc: "Join Date (Oldest)",
    };
    return sortNames[sortOption] || "Name (A-Z)";
  }

  getVerificationLevel(level) {
    const levels = {
      0: "None",
      1: "Low",
      2: "Medium",
      3: "High",
      4: "Very High",
    };
    return levels[level] || "Unknown";
  }
};
