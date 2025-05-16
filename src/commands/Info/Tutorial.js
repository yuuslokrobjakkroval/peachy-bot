const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class Tutorial extends Command {
  constructor(client) {
    super(client, {
      name: "tutorial",
      description: {
        content: "Learn how to use Peachy Bot with an interactive tutorial",
        examples: ["tutorial", "tutorial economy", "tutorial gathering"],
        usage: "tutorial [topic]",
      },
      category: "info",
      aliases: ["guide", "learn"],
      cooldown: 10,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "topic",
          description: "The tutorial topic you want to learn about",
          type: 3,
          required: false,
          choices: [
            { name: "Getting Started", value: "start" },
            { name: "Economy System", value: "economy" },
            { name: "Resource Gathering", value: "gathering" },
            { name: "Inventory Management", value: "inventory" },
            { name: "Relationships", value: "relationships" },
          ],
        },
      ],
    });

    this.tutorials = {
      start: {
        title: "Getting Started with Peachy Bot",
        pages: [
          {
            title: "Welcome to Peachy Bot!",
            description:
              "This tutorial will guide you through the basics of using Peachy Bot.",
            fields: [
              {
                name: "What is Peachy Bot?",
                value:
                  "Peachy Bot is a fun economy and social bot that lets you gather resources, earn coins, and interact with other users.",
              },
            ],
            image: "https://i.imgur.com/UCsKa6Z.gif",
          },
          {
            title: "Basic Commands",
            description: "Here are some basic commands to get you started:",
            fields: [
              {
                name: "Profile",
                value: "Use `/profile` to view your profile.",
              },
              {
                name: "Balance",
                value: "Use `/balance` to check your coin balance.",
              },
              {
                name: "Daily",
                value: "Use `/daily` to claim your daily reward.",
              },
            ],
          },
          {
            title: "Getting Help",
            description:
              "If you need help with any command, you can use the `/help` command.",
            fields: [
              {
                name: "Command Help",
                value:
                  "Use `/help [command]` to get detailed information about a specific command.",
              },
              {
                name: "Support Server",
                value:
                  "Join our support server for more help: https://discord.gg/BJT4h55hbg",
              },
            ],
          },
        ],
      },
      economy: {
        title: "Economy System Tutorial",
        pages: [
          {
            title: "Economy Basics",
            description:
              "Learn how to earn, spend, and manage your coins in Peachy Bot.",
            fields: [
              {
                name: "Earning Coins",
                value:
                  "You can earn coins through daily rewards, weekly rewards, resource gathering, and games.",
              },
            ],
          },
          {
            title: "Banking System",
            description:
              "Peachy Bot has a banking system to help you manage your coins.",
            fields: [
              {
                name: "Checking Balance",
                value: "Use `/balance` to check your coin balance.",
              },
              {
                name: "Depositing Coins",
                value:
                  "Use `/deposit <amount>` to deposit coins into your bank.",
              },
              {
                name: "Withdrawing Coins",
                value:
                  "Use `/withdraw <amount>` to withdraw coins from your bank.",
              },
            ],
          },
          {
            title: "Spending Coins",
            description: "There are many ways to spend your hard-earned coins.",
            fields: [
              {
                name: "Shopping",
                value: "Use `/shop` to browse items you can buy.",
              },
              {
                name: "Buying Items",
                value:
                  "Use `/buy <item> [quantity]` to purchase items from the shop.",
              },
              {
                name: "Gambling",
                value:
                  "Try your luck with games like `/slots`, `/blackjack`, and `/klaklouk`.",
              },
            ],
          },
        ],
      },
      gathering: {
        title: "Resource Gathering Tutorial",
        pages: [
          {
            title: "Resource Gathering Basics",
            description: "Learn how to gather resources in Peachy Bot.",
            fields: [
              {
                name: "Types of Resources",
                value:
                  "There are three main types of resources: minerals (mining), wood (chopping), and slimes (catching).",
              },
            ],
          },
          {
            title: "Mining",
            description: "Mining allows you to gather valuable minerals.",
            fields: [
              {
                name: "Mining Command",
                value: "Use `/mine` to gather minerals.",
              },
              {
                name: "Mining Tools",
                value:
                  "Better pickaxes allow you to gather more minerals. Buy them from the shop!",
              },
            ],
          },
          {
            title: "Chopping",
            description: "Chopping allows you to gather wood.",
            fields: [
              {
                name: "Chopping Command",
                value: "Use `/chop` to gather wood.",
              },
              {
                name: "Chopping Tools",
                value:
                  "Better axes allow you to gather more wood. Buy them from the shop!",
              },
            ],
          },
          {
            title: "Slime Catching",
            description: "Catching slimes is a fun way to earn resources.",
            fields: [
              {
                name: "Slime Command",
                value: "Use `/slime` to catch slimes.",
              },
              {
                name: "Slime Tools",
                value:
                  "Better nets allow you to catch more slimes. Buy them from the shop!",
              },
            ],
          },
        ],
      },
      inventory: {
        title: "Inventory Management Tutorial",
        pages: [
          {
            title: "Inventory Basics",
            description: "Learn how to manage your inventory in Peachy Bot.",
            fields: [
              {
                name: "Checking Inventory",
                value: "Use `/inventory` to view your inventory.",
              },
            ],
          },
          {
            title: "Using Items",
            description:
              "Many items in your inventory can be used for various effects.",
            fields: [
              {
                name: "Using Items",
                value: "Use `/use <item>` to use an item from your inventory.",
              },
              {
                name: "Food and Drinks",
                value:
                  "Use `/eat <food>` or `/drink <drink>` to consume food or drinks.",
              },
            ],
          },
          {
            title: "Selling Items",
            description: "You can sell items you don't need for coins.",
            fields: [
              {
                name: "Selling Command",
                value:
                  "Use `/sell <item> [quantity]` to sell items from your inventory.",
              },
              {
                name: "Selling All",
                value: "Use `/sell <item> all` to sell all of a specific item.",
              },
            ],
          },
          {
            title: "Giving Items",
            description: "You can give items to other users.",
            fields: [
              {
                name: "Giving Command",
                value:
                  "Use `/giveitem <user> <item> <quantity>` to give items to another user.",
              },
            ],
          },
        ],
      },
      relationships: {
        title: "Relationships Tutorial",
        pages: [
          {
            title: "Relationship Basics",
            description:
              "Learn how to form relationships with other users in Peachy Bot.",
            fields: [
              {
                name: "Checking Relationships",
                value: "Use `/relationship` to view your relationships.",
              },
            ],
          },
          {
            title: "Finding a Partner",
            description:
              "You can form a special bond with another user as partners.",
            fields: [
              {
                name: "Partner Command",
                value: "Use `/partner <user>` to propose to another user.",
              },
              {
                name: "Partner Benefits",
                value:
                  "Partners receive bonuses when using certain commands together.",
              },
            ],
          },
          {
            title: "Interaction Commands",
            description:
              "There are many commands to interact with other users.",
            fields: [
              {
                name: "Action Commands",
                value:
                  "Use commands like `/hug`, `/kiss`, `/slap`, etc. to interact with other users.",
              },
              {
                name: "Emote Commands",
                value:
                  "Use commands like `/happy`, `/sad`, `/angry`, etc. to express your emotions.",
              },
            ],
          },
        ],
      },
    };
  }

  async run(client, ctx, args, color, emoji, language) {
    const topic = ctx.isInteraction
      ? ctx.interaction.options.getString("topic")
      : args[0] || "start";

    // Get the tutorial for the specified topic
    const tutorial = this.tutorials[topic] || this.tutorials.start;

    let currentPage = 0;

    // Function to generate the embed for the current page
    const generateEmbed = () => {
      const page = tutorial.pages[currentPage];
      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji.mainLeft} ${page.title} ${emoji.mainRight}`)
        .setDescription(page.description);

      // Add fields if any
      if (page.fields && page.fields.length > 0) {
        page.fields.forEach((field) => {
          embed.addFields({ name: field.name, value: field.value });
        });
      }

      // Add image if any
      if (page.image) {
        embed.setImage(page.image);
      }

      // Add footer with page number
      embed.setFooter({
        text: `Page ${currentPage + 1}/${tutorial.pages.length}`,
        iconURL: ctx.author.displayAvatarURL(),
      });

      return embed;
    };

    // Function to generate navigation buttons
    const generateButtons = () => {
      const prevButton = new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0);

      const nextButton = new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === tutorial.pages.length - 1);

      const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

      return row;
    };

    // Send the initial message
    const message = await ctx.sendMessage({
      embeds: [generateEmbed()],
      components: [generateButtons()],
    });

    // Create a collector for button interactions
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 300000, // 5 minutes
    });

    collector.on("collect", async (interaction) => {
      // Update the current page based on the button clicked
      if (interaction.customId === "prev") {
        currentPage--;
      } else if (interaction.customId === "next") {
        currentPage++;
      }

      // Update the message with the new page
      await interaction.update({
        embeds: [generateEmbed()],
        components: [generateButtons()],
      });
    });

    collector.on("end", async () => {
      // Disable the buttons when the collector ends
      const disabledButtons = generateButtons();
      disabledButtons.components.forEach((button) => button.setDisabled(true));

      await message.edit({
        components: [disabledButtons],
      });
    });
  }
};
