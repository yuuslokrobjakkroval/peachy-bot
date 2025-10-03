const { Command } = require("../../structures/index.js");

module.exports = class SetPrefix extends Command {
  constructor(client) {
    super(client, {
      name: "prefix",
      description: {
        content: "Set your personal prefix or view current prefixes.",
        examples: [
          "prefix",
          "prefix set !",
          "prefix set ?",
          "prefix reset",
          "prefix help",
        ],
        usage: "prefix <set <prefix> || reset || help>",
      },
      category: "utility",
      aliases: [""],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "set",
          description: "Set your personal prefix (1-5 characters)",
          type: 1,
          options: [
            {
              name: "prefix",
              description: "Your new prefix (1-5 characters)",
              type: 3,
              required: true,
              minLength: 1,
              maxLength: 5,
            },
          ],
        },
        {
          name: "reset",
          description: "Reset your prefix to the server default",
          type: 1,
        },
        {
          name: "help",
          description: "Display usage and examples for the setprefix command",
          type: 1,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const prefixMessages = language.locales.get(language.defaultLocale)
      ?.utilityMessages?.prefixMessages;

    const embed = client
      .embed()
      .setTitle(`${emoji.mainLeft} PREFIX ${emoji.mainRight}`)
      .setColor(color.main);

    const subCommand = ctx.isInteraction
      ? ctx.interaction.options.data[0]?.name
      : args[0];

    switch (subCommand) {
      case "help": {
        embed.setDescription(
          `${
            prefixMessages?.usage || "**Usage:**"
          } \`setprefix <set <prefix> || reset || help>\`\n\n**Examples:**\n\`setprefix set !\`\n\`setprefix set ?\`\n\`setprefix reset\`\n\`setprefix help\`\n\n**Rules:**\n• 1-5 characters long\n• Cannot contain: @ # \` or line breaks\n• Examples: \`!\` \`?\` \`>>\` \`~\` \`.\``
        );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "reset": {
        const globalPrefix = client.config.prefix;
        const success = await client.prefixManager.setUserPrefix(
          ctx.author.id,
          ctx.guild?.id,
          globalPrefix
        );

        if (success) {
          embed.setDescription(
            `${prefixMessages?.resetSuccess || "Your prefix has been reset to the server default:"} \`${globalPrefix}\``
          );
        } else {
          embed.setColor(color.danger);
          embed.setDescription(
            prefixMessages?.resetError ||
              "Failed to reset your prefix. Please try again."
          );
        }

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "set": {
        const newPrefix = ctx.isInteraction
          ? ctx.interaction.options.getSubcommand("set")
            ? ctx.interaction.options.getString("prefix")
            : null
          : args[1];

        if (!newPrefix) {
          embed.setColor(color.danger);
          embed.setDescription(
            prefixMessages?.noPrefix ||
              "Please provide a prefix to set.\nUsage: `setprefix set <prefix>`"
          );
          await ctx.sendMessage({ embeds: [embed] });
          break;
        }

        // Validate prefix
        if (!client.prefixManager.isValidPrefix(newPrefix)) {
          embed.setColor(color.danger);
          embed.setDescription(
            `${prefixMessages?.invalidPrefix || "Invalid prefix! Your prefix must meet these requirements:"}\n\n**📏 Length:** 1-5 characters\n**🚫 Cannot contain:** \`@\` \`#\` \`\`\`\` or line breaks\n**💡 Examples:** \`!\` \`?\` \`>>\` \`~\` \`.\``
          );
          await ctx.sendMessage({ embeds: [embed] });
          break;
        }

        // Check if prefix is already the global prefix
        if (newPrefix.toLowerCase() === client.config.prefix.toLowerCase()) {
          embed.setColor(color.warning);
          embed.setDescription(
            `${prefixMessages?.alreadyDefault || "`{prefix}` is already the server's default prefix."}`.replace(
              "{prefix}",
              newPrefix
            )
          );
          await ctx.sendMessage({ embeds: [embed] });
          break;
        }

        const success = await client.prefixManager.setUserPrefix(
          ctx.author.id,
          ctx.guild?.id,
          newPrefix
        );

        if (success) {
          const serverMode = client.serverModeManager
            ? await client.serverModeManager.getServerMode(ctx.guild?.id)
            : "global";

          embed.setDescription(
            `${prefixMessages?.setSuccess || "Your personal prefix has been set to:"} \`${newPrefix}\`\n\n` +
              `🎮 **Usage:** Now you can use commands with: \`${newPrefix}command\`\n` +
              `🔄 **Fallback:** You can still use the server prefix: \`${client.config.prefix}\`\n` +
              `📝 **Note:** ${
                serverMode === "private"
                  ? "This prefix is specific to this server only."
                  : "This prefix works across all servers in global mode."
              }`
          );
        } else {
          embed.setColor(color.danger);
          embed.setDescription(
            prefixMessages?.setError ||
              "Failed to set your prefix. Please try again."
          );
        }

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      default: {
        // Show current prefix settings
        const prefixes = await client.prefixManager.getAllPrefixes(
          ctx.author.id,
          ctx.guild?.id
        );
        const serverMode = client.serverModeManager
          ? await client.serverModeManager.getServerMode(ctx.guild?.id)
          : "global";

        const modeEmoji = serverMode === "global" ? "🌍" : "🏠";
        const isCustomPrefix = prefixes.userPrefix !== prefixes.globalPrefix;

        embed.setDescription(
          isCustomPrefix
            ? `🎯 **Your Current Prefix:** \`${prefixes.userPrefix}\` (Custom)\n` +
                `🌐 **Server Default Prefix:** \`${prefixes.globalPrefix}\`\n` +
                `${modeEmoji} **Server Mode:** ${serverMode === "global" ? "Global Mode" : "Private Mode"}\n\n` +
                `${prefixMessages?.currentCustom || "You have a custom prefix set! You can use either prefix to run commands."}\n\n` +
                `💡 **Available Actions:**\n• Use \`setprefix set <new_prefix>\` to change your prefix\n• Use \`setprefix reset\` to return to default\n• Both prefixes work for commands`
            : `🎯 **Your Current Prefix:** \`${prefixes.userPrefix}\` (Default)\n` +
                `🌐 **Server Default Prefix:** \`${prefixes.globalPrefix}\`\n` +
                `${modeEmoji} **Server Mode:** ${serverMode === "global" ? "Global Mode" : "Private Mode"}\n\n` +
                `${prefixMessages?.currentDefault || "You're using the default server prefix."}\n\n` +
                `💡 **Available Actions:**\n• Use \`setprefix set <prefix>\` to set a custom prefix\n• Custom prefixes are 1-5 characters long\n• Examples: \`!\`, \`?\`, \`>>\`, \`~\`, \`.\``
        );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }
    }
  }
};
