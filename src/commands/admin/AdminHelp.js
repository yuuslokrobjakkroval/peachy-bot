const Command = require("../../structures/Command.js");
const { StringSelectMenuBuilder } = require("discord.js");

module.exports = class AdminHelp extends Command {
  constructor(client) {
    super(client, {
      name: "adminhelp",
      description: {
        content: "Displays the admin commands of the bot",
        examples: ["adminhelp"],
        usage: "adminhelp",
      },
      category: "admin",
      aliases: ["ah"],
      cooldown: 1,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "command",
          description: "The admin command you want to get info on",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const helpMessages = language.locales.get(language.defaultLocale)
      ?.informationMessages?.helpMessages;
    const categoriesMessages = language.locales.get(language.defaultLocale)
      ?.informationMessages?.helpMessages?.categoriesMessages;
    const prefix = client.config.prefix;

    // Enhanced admin categories with emojis
    const adminCategory = [
      // { name: "admin", emoji: "🛡️" },
      // { name: "company", emoji: "🏢" },
      // { name: "developer", emoji: "💻" },
      { name: "guild", emoji: "🏰" },
      { name: "owner", emoji: emoji.rank.owner || "👑" },
      { name: "staff", emoji: "👥" },
    ];

    const commands = client.commands.filter((cmd) =>
      adminCategory.some((cat) => cat.name === cmd.category.toLowerCase())
    );
    let selectedCategories = [];

    if (!args[0]) {
      const messageOptions = () => {
        const helpEmbed = client
          .embed()
          .setColor(color.main)
          .setTitle("🌸 Admin Command Center 🌸")
          .setDescription(
            `${emoji.mainLeft} Welcome to the Admin Hub! ${emoji.mainRight}\n\n` +
              `📋 Usage: \`${prefix}adminhelp [command]\`\n` +
              `💡 Example: \`${prefix}adminhelp ban\`\n\n` +
              `🔽 Select categories below to explore commands!\n` +
              `✨ *You can select multiple categories at once*`
          )
          .addFields([
            {
              name: `${emoji.help.category || "📚"} Available Categories`,
              value: adminCategory
                .map(
                  (category) =>
                    `${category.emoji} ${client.utils.formatCapitalize(categoriesMessages[category.name.toLowerCase()] || category.name)}`
                )
                .join("\n"),
              inline: true,
            },
            {
              name: `📊 Command Stats`,
              value: `🔢 Total Commands: ${commands.size}\n⚡ Categories: ${adminCategory.length}\n🎯 Access Level: Admin Only`,
              inline: true,
            },
          ])
          .setImage(client.config.links.banner)
          .setFooter({
            text: `${helpMessages.footer} • Use the dropdown menu below! 💝`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        const categoryOptions = adminCategory.map((category) => ({
          label: `${categoriesMessages[category.name.toLowerCase()] || client.utils.formatCapitalize(category.name)}`,
          value: category.name.toLowerCase(),
          emoji: category.emoji,
          description: `View all ${category.name} commands`,
          default: selectedCategories.includes(category.name.toLowerCase()),
        }));

        const categorySelectMenu = new StringSelectMenuBuilder()
          .setCustomId("category_select")
          .setPlaceholder("🎯 Select one or more categories... 🌟")
          .setMinValues(1)
          .setMaxValues(adminCategory.length)
          .addOptions(categoryOptions);

        const row = client.utils.createButtonRow(categorySelectMenu);

        return { embeds: [helpEmbed], components: [row] };
      };

      // Send Admin Help Message
      const replyMessage = await (ctx.isInteraction
        ? ctx.interaction.reply({ ...messageOptions(), fetchReply: true })
        : ctx.channel.send({ ...messageOptions(), fetchReply: true }));

      // Collector for Category Selection
      const collector = replyMessage.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === ctx.author.id,
        time: 3000000,
      });

      collector.on("collect", async (interaction) => {
        selectedCategories = interaction.values;
        const categoryCommands = commands.filter((cmd) =>
          selectedCategories.includes(cmd.category.toLowerCase())
        );

        let commandsDisplay = "";
        let totalCommands = 0;

        // Group commands by category for better display
        selectedCategories.forEach((selectedCategory) => {
          const catCommands = commands.filter(
            (cmd) => cmd.category.toLowerCase() === selectedCategory
          );

          if (catCommands.size > 0) {
            const categoryInfo = adminCategory.find(
              (cat) => cat.name === selectedCategory
            );
            commandsDisplay += `\n${categoryInfo.emoji} ${client.utils.formatCapitalize(categoriesMessages[selectedCategory] || selectedCategory)}\n`;

            Array.from(catCommands.values()).forEach((cmd) => {
              commandsDisplay += `├ \`${cmd.name}\` - ${cmd.description.content.slice(0, 50)}${cmd.description.content.length > 50 ? "..." : ""}\n`;
              totalCommands++;
            });
          }
        });

        if (commandsDisplay === "") {
          commandsDisplay = "❌ No commands found in the selected categories.";
        }

        const selectedEmbed = client
          .embed()
          .setColor(color.main)
          .setTitle(`🎯 Selected Categories (${selectedCategories.length}) 🎯`)
          .setDescription(
            `${emoji.mainLeft} Admin Commands Overview ${emoji.mainRight}\n\n` +
              `📊 Showing ${totalCommands} commands from your selection\n` +
              `💡 Usage: \`${prefix}adminhelp [command]\` for detailed info\n` +
              `🔄 Change selection using the dropdown below`
          )
          .addFields([
            {
              name: `📋 Commands List`,
              value:
                commandsDisplay.length > 1024
                  ? commandsDisplay.slice(0, 1021) + "..."
                  : commandsDisplay || "No commands available",
              inline: false,
            },
          ])
          .setImage(client.config.links.banner)
          .setFooter({
            text: `${helpMessages.footer} • Selected: ${selectedCategories.join(", ")} 💖`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        const categoryOptions = adminCategory.map((category) => ({
          label: `${categoriesMessages[category.name.toLowerCase()] || client.utils.formatCapitalize(category.name)}`,
          value: category.name.toLowerCase(),
          emoji: category.emoji,
          description: `View all ${category.name} commands`,
          default: selectedCategories.includes(category.name.toLowerCase()),
        }));

        const categorySelectMenu = new StringSelectMenuBuilder()
          .setCustomId("category_select")
          .setPlaceholder(
            `🎯 ${selectedCategories.length} selected • Choose more... ✨`
          )
          .setMinValues(1)
          .setMaxValues(adminCategory.length)
          .addOptions(categoryOptions);

        const row = client.utils.createButtonRow(categorySelectMenu);

        await interaction.update({
          embeds: [selectedEmbed],
          components: [row],
        });
      });

      collector.on("end", () => {
        replyMessage.edit({ components: [] }).catch(() => {});
      });
    } else {
      const command = client.commands.get(args[0].toLowerCase());
      if (!command)
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setTitle("❌ Command Not Found")
              .setDescription(
                `🔍 Could not find command: \`${args[0]}\`\n\n💡 Tip: Use \`${prefix}adminhelp\` to see all available commands! 🌸`
              )
              .setFooter({
                text: "Make sure you typed the command name correctly 💭",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTimestamp(),
          ],
        });

      // Get category emoji
      const categoryInfo = adminCategory.find(
        (cat) => cat.name === command.category.toLowerCase()
      );
      const categoryEmoji = categoryInfo ? categoryInfo.emoji : "📁";

      const helpEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(
          `${categoryEmoji} ${client.utils.formatCapitalize(command.name)} Command`
        )
        .setDescription(`✨ ${command.description.content}`)
        .addFields([
          {
            name: `${categoryEmoji} Category`,
            value: `\`${client.utils.formatCapitalize(command.category)}\``,
            inline: true,
          },
          {
            name: `🏷️ Aliases`,
            value:
              command.aliases.length > 0
                ? command.aliases.map((alias) => `\`${alias}\``).join(", ")
                : "`None`",
            inline: true,
          },
          {
            name: `⏱️ Cooldown`,
            value: `\`${client.utils.formatTime(command.cooldown)}\``,
            inline: true,
          },
          {
            name: `🔐 Bot Permissions`,
            value:
              command.permissions.client.length > 0
                ? command.permissions.client
                    .map((perm) => `\`${perm}\``)
                    .join(", ")
                : "`None required`",
            inline: false,
          },
          {
            name: `📝 Usage Examples`,
            value: `\`\`\`yaml\n${command.description.examples
              .map((example) => `${prefix}${example}`)
              .join("\n")}\n\`\`\``,
            inline: false,
          },
        ])
        .setFooter({
          text: `Requested by ${ctx.author.username} • Admin Command 💫`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      await ctx.sendMessage({ embeds: [helpEmbed] });
    }
  }
};
