const Command = require("../../structures/Command.js");
const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Help extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      description: {
        content: "Displays the commands of the bot",
        examples: ["help"],
        usage: "help",
      },
      category: "info",
      aliases: ["h"],
      cooldown: 3,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "command",
          description: "The command you want to get info on",
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
    const adminCategory = [
      "admin",
      "company",
      "dev",
      "guild",
      "owner",
      "staff",
    ];
    const categories = [
      "actions",
      // "animals",
      "bank",
      "economy",
      "emotes",
      "fun",
      "gambling",
      "games",
      "giveaways",
      "info",
      "inventory",
      "profile",
      "rank",
      "social",
      "relationship",
      "utility",
      // "work",
    ];
    const commands = client.commands.filter(
      (cmd) => !adminCategory.includes(cmd.category)
    );
    const selectedItemIndex = null;

    // Pagination settings
    const COMMANDS_PER_PAGE = 8;
    const categoryPages = {};

    // Calculate pages for each category
    categories.forEach((category) => {
      const categoryCommands = commands.filter(
        (cmd) => cmd.category.toLowerCase() === category.toLowerCase()
      );
      categoryPages[category] =
        Math.ceil(categoryCommands.size / COMMANDS_PER_PAGE) || 1;
    });

    // Message Options
    if (!args[0]) {
      const messageOptions = () => {
        const totalCommands = categories.reduce((sum, category) => {
          const categoryCommands = commands.filter(
            (cmd) => cmd.category.toLowerCase() === category.toLowerCase()
          );
          return sum + categoryCommands.size;
        }, 0);

        // Group categories into sections for a cleaner display
        const groupedCategories = {
          "Social & Fun": categories.filter((cat) =>
            [
              "actions",
              // "animals",
              "emotes",
              "fun",
              "social",
              "relationship",
            ].includes(cat)
          ),
          "Economy & Games": categories.filter((cat) =>
            [
              "bank",
              "economy",
              "gambling",
              "games",
              "inventory",
              // "work",
            ].includes(cat)
          ),
          "Utility & Info": categories.filter((cat) =>
            ["giveaways", "info", "profile", "rank", "utility"].includes(cat)
          ),
        };

        // Create a more visually appealing embed
        const helpEmbed = new EmbedBuilder()
          .setColor(color.main)
          .setAuthor({
            name: "Command Help Center",
            iconURL: client.user.displayAvatarURL(),
          })
          .setDescription(
            `${helpMessages.description} **${prefix}help [command]**\n` +
              `${helpMessages.examples} **${prefix}help balance**\n\n` +
              `${helpMessages.note}`
          )
          .setThumbnail(
            client.user.displayAvatarURL({ dynamic: true, size: 512 })
          )
          .setImage(client.config.links.banner)
          .setFooter({
            text: `${totalCommands} total commands available`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        // Add category groups as fields
        Object.entries(groupedCategories).forEach(
          ([groupName, groupCategories]) => {
            helpEmbed.addFields({
              name: `${groupName}`,
              value: groupCategories
                .map((category) => {
                  const categoryCommandCount = commands.filter(
                    (cmd) =>
                      cmd.category.toLowerCase() === category.toLowerCase()
                  ).size;
                  return `${
                    emoji.help[category.toLowerCase()]
                      ? emoji.help[category.toLowerCase()]
                      : globalEmoji.help[category.toLowerCase()] || "•"
                  } **${
                    categoriesMessages[category.toLowerCase()] ||
                    client.utils.formatCapitalize(category)
                  }** (${categoryCommandCount})`;
                })
                .join("\n"),
              inline: false,
            });
          }
        );

        // Create a more attractive dropdown
        const categoryOptions = categories.map((category) => {
          const categoryCommandCount = commands.filter(
            (cmd) => cmd.category.toLowerCase() === category.toLowerCase()
          ).size;
          return {
            emoji: `${emoji.help[category.toLowerCase()] || ""}`,
            label: `${
              categoriesMessages[category.toLowerCase()] ||
              client.utils.formatCapitalize(category)
            }`,
            description: `View ${categoryCommandCount} commands`,
            value: category.toLowerCase(),
            default: selectedItemIndex === category.toLowerCase(),
          };
        });

        const categorySelectButton = new StringSelectMenuBuilder()
          .setCustomId("category_select")
          .setPlaceholder("📚 Browse command categories")
          .addOptions(categoryOptions);

        // Add navigation buttons
        const homeButton = new ButtonBuilder()
          .setCustomId("home")
          .setLabel("Home")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🏠");

        const dashboardButton = new ButtonBuilder()
          .setLabel("Dashboard")
          .setStyle(ButtonStyle.Link)
          .setURL(
            client.config.links.dashboard ||
              `https://peachy-gang-dashboard.vercel.app`
          )
          .setEmoji("🌐");

        const supportButton = new ButtonBuilder()
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL(
            client.config.links.support || "https://discord.gg/peachygang"
          )
          .setEmoji("❓");

        const inviteButton = new ButtonBuilder()
          .setLabel("Invite")
          .setStyle(ButtonStyle.Link)
          .setURL(
            client.config.links.invite ||
              `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
          )
          .setEmoji("➕");

        const selectRow = new ActionRowBuilder().addComponents(
          categorySelectButton
        );
        const buttonRow = new ActionRowBuilder().addComponents(
          homeButton,
          dashboardButton,
          supportButton,
          inviteButton
        );

        return { embeds: [helpEmbed], components: [selectRow, buttonRow] };
      };

      // Send Help Message
      const replyMessage = await (ctx.isInteraction
        ? ctx.interaction.reply({ ...messageOptions(), fetchReply: true })
        : ctx.channel.send({ ...messageOptions(), fetchReply: true }));

      // Track current page for each category
      const currentPages = {};
      categories.forEach((category) => {
        currentPages[category] = 1;
      });

      // Collector for Category Selection
      const collector = replyMessage.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === ctx.author.id,
        time: 300000, // 5 minutes
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "home") {
          await interaction.update(messageOptions());
          return;
        }

        // Handle pagination buttons
        if (
          interaction.customId.startsWith("prev_page_") ||
          interaction.customId.startsWith("next_page_")
        ) {
          const parts = interaction.customId.split("_page_");
          const action = parts[0]; // "prev" or "next"
          const category = parts[1];

          if (action === "prev" && currentPages[category] > 1) {
            currentPages[category]--;
          } else if (
            action === "next" &&
            currentPages[category] < categoryPages[category]
          ) {
            currentPages[category]++;
          }

          // Generate the category page with updated page number
          await this.showCategoryPage(
            interaction,
            category,
            currentPages[category],
            categoryPages[category],
            commands,
            COMMANDS_PER_PAGE,
            client,
            color,
            emoji,
            categoriesMessages,
            prefix,
            categories
          );
          return;
        }

        if (interaction.customId === "category_select") {
          const selectedCategory = interaction.values[0];

          // Reset to page 1 when selecting a new category
          currentPages[selectedCategory] = 1;

          // Show the first page of the selected category
          await this.showCategoryPage(
            interaction,
            selectedCategory,
            currentPages[selectedCategory],
            categoryPages[selectedCategory],
            commands,
            COMMANDS_PER_PAGE,
            client,
            color,
            emoji,
            categoriesMessages,
            prefix,
            categories
          );
        }
      });

      collector.on("end", () => {
        // Make buttons disabled instead of removing them completely
        const disabledComponents = replyMessage.components.map((row) => {
          const newRow = new ActionRowBuilder();
          row.components.forEach((component) => {
            if (component.type === 3) {
              // Select menu
              newRow.addComponents(
                StringSelectMenuBuilder.from(component).setDisabled(true)
              );
            } else if (
              component.type === 2 &&
              component.style !== ButtonStyle.Link
            ) {
              // Button (not link)
              newRow.addComponents(
                ButtonBuilder.from(component).setDisabled(true)
              );
            } else {
              newRow.addComponents(component);
            }
          });
          return newRow;
        });

        replyMessage.edit({ components: disabledComponents }).catch(() => {});
      });
    } else {
      const command = client.commands.get(args[0].toLowerCase());
      if (!command)
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(`${helpMessages.commandNotFound} \`${args[0]}\``),
          ],
        });

      // Create a more detailed and visually appealing command help embed
      const helpEmbed = new EmbedBuilder()
        .setColor(color.main)
        .setAuthor({
          name: `Command: ${client.utils.formatCapitalize(command.name)}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(command.description.content)
        .addFields([
          {
            name: "Category",
            value: `${emoji.help[command.category.toLowerCase()] || ""} ${
              categoriesMessages[command.category.toLowerCase()] ||
              client.utils.formatCapitalize(command.category)
            }`,
            inline: true,
          },
          {
            name: "Cooldown",
            value: `⏱️ ${client.utils.formatTime(command.cooldown)}`,
            inline: true,
          },
          {
            name: "Aliases",
            value:
              command.aliases.length > 0
                ? command.aliases.map((alias) => `\`${alias}\``).join(", ")
                : "No aliases",
            inline: false,
          },
          {
            name: "Usage",
            value: `\`\`\`\n${prefix}${command.description.usage}\n\`\`\``,
            inline: false,
          },
          {
            name: "Examples",
            value: `\`\`\`\n${command.description.examples
              .map((example) => `${prefix}${example}`)
              .join("\n")}\n\`\`\``,
            inline: false,
          },
          {
            name: "Required Permissions",
            value:
              command.permissions.client.length > 0
                ? command.permissions.client
                    .map((perm) => `\`${perm}\``)
                    .join(", ")
                : "No special permissions required",
            inline: false,
          },
        ])
        .setFooter({
          text: `Tip: You can use ${prefix}help to see all commands`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Add back button
      const backButton = new ButtonBuilder()
        .setCustomId("back_to_help")
        .setLabel("Back to Help")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️");

      const row = new ActionRowBuilder().addComponents(backButton);

      const replyMessage = await ctx.sendMessage({
        embeds: [helpEmbed],
        components: [row],
      });

      // Create collector for back button
      const collector = replyMessage.createMessageComponentCollector({
        filter: (interaction) =>
          interaction.user.id === ctx.author.id &&
          interaction.customId === "back_to_help",
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        // Run the help command without arguments
        this.run(client, ctx, [], color, emoji, language);
        await interaction.deferUpdate();
      });

      collector.on("end", () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(backButton).setDisabled(true)
        );
        replyMessage.edit({ components: [disabledRow] }).catch(() => {});
      });
    }
  }

  // Helper method to show a specific page of commands for a category
  async showCategoryPage(
    interaction,
    category,
    currentPage,
    totalPages,
    commands,
    commandsPerPage,
    client,
    color,
    emoji,
    categoriesMessages,
    prefix,
    categories
  ) {
    const categoryCommands = commands.filter(
      (cmd) => cmd.category.toLowerCase() === category.toLowerCase()
    );

    // Calculate start and end indices for the current page
    const startIdx = (currentPage - 1) * commandsPerPage;
    const endIdx = Math.min(startIdx + commandsPerPage, categoryCommands.size);

    // Get commands for the current page
    const pageCommands = Array.from(categoryCommands.values()).slice(
      startIdx,
      endIdx
    );

    // Create embed for the current page
    const selectedEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setAuthor({
        name: `${
          categoriesMessages[category.toLowerCase()] ||
          client.utils.formatCapitalize(category)
        } Commands`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        `Browse all commands in the **${
          categoriesMessages[category.toLowerCase()] ||
          client.utils.formatCapitalize(category)
        }** category.\n` +
          `Use \`${prefix}help [command]\` for detailed information about a specific command.`
      )
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setFooter({
        text: `Page ${currentPage}/${totalPages} • ${categoryCommands.size} commands in this category`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    // Group commands by first letter for a cleaner display
    const commandsByLetter = {};
    pageCommands.forEach((cmd) => {
      const firstLetter = cmd.name.charAt(0).toUpperCase();
      if (!commandsByLetter[firstLetter]) {
        commandsByLetter[firstLetter] = [];
      }
      commandsByLetter[firstLetter].push(cmd);
    });

    // Add command groups as fields
    Object.entries(commandsByLetter)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([letter, cmds]) => {
        selectedEmbed.addFields({
          name: `${letter}`,
          value: cmds
            .map(
              (cmd) =>
                `\`${cmd.name}\` - ${
                  cmd.description.content.length > 50
                    ? cmd.description.content.substring(0, 50) + "..."
                    : cmd.description.content
                }`
            )
            .join("\n"),
          inline: false,
        });
      });

    // Create dropdown with current category selected
    const categoryOptions = categories.map((cat) => ({
      emoji: `${emoji.help[cat.toLowerCase()] || ""}`,
      label: `${
        categoriesMessages[cat.toLowerCase()] ||
        client.utils.formatCapitalize(cat)
      }`,
      description: `View ${cat} commands`,
      value: cat.toLowerCase(),
      default: cat.toLowerCase() === category.toLowerCase(),
    }));

    const categorySelectMenu = new StringSelectMenuBuilder()
      .setCustomId("category_select")
      .setPlaceholder("📚 Browse command categories")
      .addOptions(categoryOptions);

    // Create pagination buttons
    const prevButton = new ButtonBuilder()
      .setCustomId(`prev_page_${category}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("◀️")
      .setDisabled(currentPage === 1);

    const nextButton = new ButtonBuilder()
      .setCustomId(`next_page_${category}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("▶️")
      .setDisabled(currentPage === totalPages);

    const homeButton = new ButtonBuilder()
      .setCustomId("home")
      .setLabel("Home")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🏠");

    const pageIndicator = new ButtonBuilder()
      .setCustomId("page_indicator")
      .setLabel(`Page ${currentPage}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    // Create rows for components
    const selectRow = new ActionRowBuilder().addComponents(categorySelectMenu);

    // Only add pagination row if there are multiple pages
    let buttonRow;
    if (totalPages > 1) {
      buttonRow = new ActionRowBuilder().addComponents(
        prevButton,
        pageIndicator,
        nextButton,
        homeButton
      );
    } else {
      buttonRow = new ActionRowBuilder().addComponents(homeButton);
    }

    // Update the message
    await interaction.update({
      embeds: [selectedEmbed],
      components: [selectRow, buttonRow],
    });
  }
};
