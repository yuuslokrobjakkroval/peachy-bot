const { Command } = require("../../structures/index.js");

module.exports = class ServerMode extends Command {
  constructor(client) {
    super(client, {
      name: "servermode",
      description: {
        content: "Manage server data mode (Global or Private).",
        examples: [
          "servermode info",
          "servermode set global",
          "servermode set private Server-specific economy",
          "servermode import",
          "servermode export",
          "servermode stats",
        ],
        usage:
          "servermode <info || set <mode> [reason] || import || export || stats>",
      },
      category: "admin",
      aliases: ["smode", "serverm"],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: ["Administrator"],
      },
      slashCommand: true,
      options: [
        {
          name: "info",
          description: "Get current server mode information",
          type: 1,
        },
        {
          name: "set",
          description: "Set server mode (Global or Private)",
          type: 1,
          options: [
            {
              name: "mode",
              description: "Server mode to set (global or private)",
              type: 3,
              required: true,
              choices: [
                { name: "🌍 Global Mode", value: "global" },
                { name: "🏠 Private Mode", value: "private" },
              ],
            },
            {
              name: "reason",
              description: "Reason for changing server mode",
              type: 3,
              required: false,
            },
          ],
        },
        {
          name: "import",
          description: "Import your global data to private mode",
          type: 1,
        },
        {
          name: "export",
          description: "Export your private data to global mode",
          type: 1,
        },
        {
          name: "stats",
          description: "View server mode statistics",
          type: 1,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const serverMessages = language.locales.get(language.defaultLocale)
      ?.adminMessages?.serverModeMessages;

    const user = await client.serverModeManager.getUserData(
      ctx.author.id,
      ctx.guild?.id
    );

    const subCommand = ctx.isInteraction
      ? ctx.interaction.options.data[0]?.name
      : args[0];

    try {
      switch (subCommand) {
        case "info":
          return await this.handleInfo(
            client,
            ctx,
            color,
            emoji,
            serverMessages
          );
        case "set":
          return await this.handleSet(
            client,
            ctx,
            args,
            color,
            emoji,
            serverMessages
          );
        case "import":
          return await this.handleImport(
            client,
            ctx,
            color,
            emoji,
            serverMessages
          );
        case "export":
          return await this.handleExport(
            client,
            ctx,
            color,
            emoji,
            serverMessages
          );
        case "stats":
          return await this.handleStats(
            client,
            ctx,
            color,
            emoji,
            serverMessages
          );
        default:
          return await this.handleInfo(
            client,
            ctx,
            color,
            emoji,
            serverMessages
          );
      }
    } catch (error) {
      client.logger.error("Error in servermode command:", error);

      const errorEmbed = client
        .embed()
        .setColor(color.danger)
        .setTitle("❌ Error")
        .setDescription(
          serverMessages?.error ||
            "An error occurred while processing your request."
        )
        .setTimestamp();

      await ctx.sendMessage({ embeds: [errorEmbed] });
    }
  }

  async handleInfo(client, ctx, color, emoji, messages) {
    const guildId = ctx.guild?.id;

    const currentMode = await client.serverModeManager.getServerMode(guildId);
    const stats = await client.serverModeManager.getServerModeStats(guildId);

    const modeEmoji = currentMode === "global" ? "🌍" : "🏠";
    const modeColor = currentMode === "global" ? color.blue : color.pink;

    const embed = client
      .embed()
      .setColor(modeColor)
      .setTitle(
        `${emoji.mainLeft} ${modeEmoji} Server Mode Information ${emoji.mainRight}`
      )
      .setDescription(this.getModeDescription(currentMode, messages))
      .addFields([
        {
          name: "📊 Current Mode",
          value: `\`\`\`${currentMode.toUpperCase()}\`\`\``,
          inline: true,
        },
        {
          name: "📈 Total Switches",
          value: `\`\`\`${stats?.totalSwitches || 0}\`\`\``,
          inline: true,
        },
        {
          name: "🕒 Last Switch",
          value: stats?.lastSwitched
            ? `<t:${Math.floor(stats.lastSwitched.getTime() / 1000)}:R>`
            : "`Never`",
          inline: true,
        },
      ])
      .setFooter(ctx.guild.name, ctx.guild.iconURL())
      .setTimestamp();

    await ctx.sendMessage({ embeds: [embed] });
  }

  async handleSet(client, ctx, args, color, emoji, messages) {
    const guildId = ctx.guild?.id;
    const userId = ctx.author.id;

    const newMode = ctx.isInteraction
      ? ctx.interaction.options.getSubcommand("set")
        ? ctx.interaction.options.getString("mode")
        : null
      : args[1];

    const reason = ctx.isInteraction
      ? ctx.interaction.options.getString("reason") || "No reason provided"
      : args.slice(2).join(" ") || "No reason provided";

    if (!newMode || !["global", "private"].includes(newMode.toLowerCase())) {
      const embed = client
        .embed()
        .setColor(color.danger)
        .setTitle("❌ Invalid Mode")
        .setDescription(
          messages?.invalidMode ||
            "Please specify a valid mode: `global` or `private`\n\n**Usage:** `servermode set <global|private> [reason]`"
        )
        .setTimestamp();

      return await ctx.sendMessage({ embeds: [embed] });
    }

    // Check if user has administrator permission
    if (ctx.isInteraction) {
      if (!ctx.interaction.member.permissions.has("Administrator")) {
        const errorEmbed = client
          .embed()
          .setColor(color.danger)
          .setTitle("❌ Permission Denied")
          .setDescription(
            messages?.noPermission ||
              "You need Administrator permission to change server mode."
          )
          .setTimestamp();

        return await ctx.sendMessage({ embeds: [errorEmbed] });
      }
    } else {
      if (!ctx.member.permissions.has("Administrator")) {
        const errorEmbed = client
          .embed()
          .setColor(color.danger)
          .setTitle("❌ Permission Denied")
          .setDescription(
            messages?.noPermission ||
              "You need Administrator permission to change server mode."
          )
          .setTimestamp();

        return await ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    const currentMode = await client.serverModeManager.getServerMode(guildId);
    const normalizedNewMode = newMode.toLowerCase();

    if (currentMode === normalizedNewMode) {
      const embed = client
        .embed()
        .setColor(color.warning)
        .setTitle("⚠️ No Change Needed")
        .setDescription(
          messages?.alreadyInMode?.replace(
            "{mode}",
            normalizedNewMode.toUpperCase()
          ) ||
            `Server is already in **${normalizedNewMode.toUpperCase()}** mode.`
        )
        .setTimestamp();

      return await ctx.sendMessage({ embeds: [embed] });
    }

    // For text commands, we'll directly set the mode (administrators only)
    // For slash commands, we could add confirmation logic later if needed

    const success = await client.serverModeManager.setServerMode(
      guildId,
      normalizedNewMode,
      userId,
      reason
    );

    if (success) {
      const modeEmoji = normalizedNewMode === "global" ? "🌍" : "🏠";
      const successEmbed = client
        .embed()
        .setColor(color.success)
        .setTitle(`${modeEmoji} Server Mode Changed Successfully`)
        .setDescription(
          messages?.modeChanged?.replace(
            "{mode}",
            normalizedNewMode.toUpperCase()
          ) ||
            `Server mode has been changed to **${normalizedNewMode.toUpperCase()}**.`
        )
        .addFields([
          {
            name: "📝 Changed By",
            value: `${ctx.author} (${ctx.author.tag})`,
            inline: true,
          },
          {
            name: "📝 Reason",
            value: `\`\`\`${reason}\`\`\``,
            inline: false,
          },
          {
            name: "ℹ️ What's Next?",
            value:
              normalizedNewMode === "private"
                ? messages?.nextStepsPrivate ||
                  "Users can now use `servermode import` to import their global data."
                : messages?.nextStepsGlobal ||
                  "All users will now use their global data across all servers.",
            inline: false,
          },
        ])
        .setTimestamp();

      await ctx.sendMessage({ embeds: [successEmbed] });
    } else {
      const errorEmbed = client
        .embed()
        .setColor(color.danger)
        .setTitle("❌ Failed to Change Mode")
        .setDescription(
          messages?.changeError ||
            "There was an error changing the server mode. Please try again."
        )
        .setTimestamp();

      await ctx.sendMessage({ embeds: [errorEmbed] });
    }
  }

  async handleImport(client, ctx, color, emoji, messages) {
    const guildId = ctx.guild?.id;
    const userId = ctx.author.id;

    const currentMode = await client.serverModeManager.getServerMode(guildId);

    if (currentMode !== "private") {
      const embed = client
        .embed()
        .setColor(color.danger)
        .setTitle("❌ Import Not Available")
        .setDescription(
          messages?.importNotAvailable ||
            "Data import is only available in **PRIVATE** mode."
        )
        .addFields([
          {
            name: "💡 Tip",
            value:
              messages?.importTip ||
              "Ask an administrator to switch to private mode using `servermode set private`.",
            inline: false,
          },
        ])
        .setTimestamp();

      return await ctx.sendMessage({ embeds: [embed] });
    }

    const success = await client.serverModeManager.importGlobalDataToPrivate(
      userId,
      guildId
    );

    if (success) {
      const embed = client
        .embed()
        .setColor(color.success)
        .setTitle("✅ Data Import Successful")
        .setDescription(
          messages?.importSuccess ||
            "Your global data has been successfully imported to this server's private mode."
        )
        .addFields([
          {
            name: "📊 What was imported?",
            value:
              messages?.importedData ||
              "• Balance & Economy data\n• Profile information\n• Inventory & Items\n• Relationships\n• Achievements\n• All progress data",
            inline: false,
          },
          {
            name: "ℹ️ Note",
            value:
              messages?.importNote ||
              "Your global data remains unchanged. You now have separate progress in this server.",
            inline: false,
          },
        ])
        .setTimestamp();

      await ctx.sendMessage({ embeds: [embed] });
    } else {
      const embed = client
        .embed()
        .setColor(color.warning)
        .setTitle("⚠️ Import Failed")
        .setDescription(
          messages?.importFailed ||
            "Could not import your global data. This might be because:"
        )
        .addFields([
          {
            name: "Possible Reasons",
            value:
              messages?.importFailReasons ||
              "• You have no global data to import\n• Data has already been imported\n• Database error occurred",
            inline: false,
          },
          {
            name: "💡 Tip",
            value:
              messages?.importFailTip ||
              "Try using the bot in global mode first to create some data, then come back to import.",
            inline: false,
          },
        ])
        .setTimestamp();

      await ctx.sendMessage({ embeds: [embed] });
    }
  }

  async handleExport(client, ctx, color, emoji, messages) {
    const guildId = ctx.guild?.id;
    const userId = ctx.author.id;

    const success = await client.serverModeManager.exportPrivateDataToGlobal(
      userId,
      guildId
    );

    if (success) {
      const embed = client
        .embed()
        .setColor(color.success)
        .setTitle("✅ Data Export Successful")
        .setDescription(
          messages?.exportSuccess ||
            "Your private server data has been exported to your global profile."
        )
        .addFields([
          {
            name: "📊 What was exported?",
            value:
              messages?.exportedData ||
              "• Balance & Economy data\n• Profile information\n• Inventory & Items\n• Relationships\n• Achievements\n• All progress data",
            inline: false,
          },
          {
            name: "⚠️ Important",
            value:
              messages?.exportWarning ||
              "Your global data has been **overwritten** with this server's data. Your private server data remains unchanged.",
            inline: false,
          },
        ])
        .setTimestamp();

      await ctx.sendMessage({ embeds: [embed] });
    } else {
      const embed = client
        .embed()
        .setColor(color.warning)
        .setTitle("⚠️ Export Failed")
        .setDescription(
          messages?.exportFailed || "Could not export your private data."
        )
        .addFields([
          {
            name: "Possible Reasons",
            value:
              messages?.exportFailReasons ||
              "• You have no private data in this server\n• Database error occurred",
            inline: false,
          },
        ])
        .setTimestamp();

      await ctx.sendMessage({ embeds: [embed] });
    }
  }

  async handleStats(client, ctx, color, emoji, messages) {
    const guildId = ctx.guild?.id;

    const currentMode = await client.serverModeManager.getServerMode(guildId);
    const stats = await client.serverModeManager.getServerModeStats(guildId);

    let userCount = 0;
    if (currentMode === "private") {
      const guildUsers = await client.serverModeManager.getGuildUsers(guildId);
      userCount = guildUsers.length;
    }

    const modeEmoji = currentMode === "global" ? "🌍" : "🏠";
    const modeColor = currentMode === "global" ? color.blue : color.pink;

    const embed = client
      .embed()
      .setColor(modeColor)
      .setTitle(
        `${emoji.mainLeft} ${modeEmoji} Server Mode Statistics ${emoji.mainRight}`
      )
      .addFields([
        {
          name: "📊 Current Mode",
          value: `\`\`\`${currentMode.toUpperCase()}\`\`\``,
          inline: true,
        },
        {
          name: "👥 Active Users",
          value:
            currentMode === "private"
              ? `\`\`\`${userCount}\`\`\``
              : "`Global Mode`",
          inline: true,
        },
        {
          name: "🔄 Total Switches",
          value: `\`\`\`${stats?.totalSwitches || 0}\`\`\``,
          inline: true,
        },
        {
          name: "🕒 Last Switch",
          value: stats?.lastSwitched
            ? `<t:${Math.floor(stats.lastSwitched.getTime() / 1000)}:F>`
            : "`Never`",
          inline: false,
        },
      ]);

    if (stats?.switchHistory && stats.switchHistory.length > 0) {
      const lastSwitch = stats.switchHistory[stats.switchHistory.length - 1];
      embed.addFields([
        {
          name: "📋 Last Switch Details",
          value: `**From:** ${lastSwitch.fromMode.toUpperCase()}\n**To:** ${lastSwitch.toMode.toUpperCase()}\n**Reason:** ${lastSwitch.reason || "No reason provided"}`,
          inline: false,
        },
      ]);
    }

    embed.setFooter(ctx.guild.name, ctx.guild.iconURL()).setTimestamp();

    await ctx.sendMessage({ embeds: [embed] });
  }

  getModeDescription(mode, messages) {
    if (mode === "global") {
      return (
        messages?.globalDescription ||
        "🌍 **Global Mode**: User data is shared across all servers using this bot. Your balance, inventory, and progress are the same everywhere."
      );
    } else {
      return (
        messages?.privateDescription ||
        "🏠 **Private Mode**: User data is specific to this server only. Your progress here is separate from other servers."
      );
    }
  }
};
