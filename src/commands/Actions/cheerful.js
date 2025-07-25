const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const globalEmoji = require("../../utils/Emoji.js");

module.exports = class Happy extends Command {
  constructor(client) {
    super(client, {
      name: "cheerful",
      description: {
        content: "Express that you're cheerful with another user.",
        examples: ["cheerful @User"],
        usage: "cheerful @User",
      },
      category: "actions",
      aliases: ["joy", "cheer", "glad"],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user you are cheerful with",
          type: 6, // USER
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      const generalMessages = language.locales.get(language.defaultLocale)
        ?.generalMessages || {
        title: "%{mainLeft} %{title} %{mainRight}",
        requestedBy: "Requested by %{username}",
      };

      const happySentences = [
        "You always brighten my day!",
        "I’m so grateful to have you in my life.",
        "You make everything better just by being around.",
        "I love how you always know how to make me smile.",
        "You are an absolute joy to be with!",
        "Life feels happier when I’m with you.",
        "You inspire me every single day.",
        "Thank you for being such a wonderful friend.",
        "You bring so much light and laughter.",
        "I feel lucky to know someone as amazing as you.",
        "You make the world a better place.",
        "I’m so happy when we’re together.",
        "You have a heart of gold.",
        "Your smile is contagious.",
        "I appreciate all the little things you do.",
        "You’re simply the best!",
        "You make my heart sing with joy.",
        "I feel so comfortable and happy around you.",
        "You bring out the best in me.",
        "You’re a treasure I’m grateful for.",
        "I can’t stop smiling when I think of you.",
        "Your kindness makes a huge difference.",
        "Being with you feels like a warm hug.",
        "You make every day feel special.",
        "I’m so proud to call you my friend.",
        "You have an incredible way of making me happy.",
        "I’m thankful for all the good times we share.",
        "You’re a true blessing in my life.",
        "You always know how to cheer me up.",
        "I admire your positive spirit.",
        "You light up every room you enter.",
        "I’m filled with happiness when you’re near.",
        "Your laughter is music to my ears.",
        "You make me believe in happiness again.",
        "I’m so glad you’re here with me.",
        "You have a smile that can brighten the darkest days.",
        "You bring sunshine wherever you go.",
        "I feel so joyful when we talk.",
        "You’re a wonderful person and I’m happy to know you.",
        "I treasure our moments together.",
        "You’re my sunshine on cloudy days.",
        "Your friendship means the world to me.",
        "You’re amazing just the way you are.",
        "I’m thankful for your support and love.",
        "You bring happiness with every word.",
        "I’m so happy to share this journey with you.",
        "You’re the reason I smile so much.",
        "You make my heart feel full.",
        "I’m joyful because you’re in my life.",
        "You have an amazing way of making me happy.",
        "You’re the best part of my day!",
        "I’m happy just thinking about you.",
      ];

      // Get target user
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() ||
          (await client.users.fetch(args[0]).catch(() => null));

      if (!target) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          "You must mention a user you’re happy with.",
          color
        );
      }

      if (target.id === ctx.author.id) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          "You can’t express happiness only to yourself!",
          color
        );
      }

      // Pick a random happy sentence
      const randomSentence = client.utils.getRandomElement(happySentences);

      // Create embed with happy message
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft || "😊")
            .replace("%{title}", "HAPPY")
            .replace("%{mainRight}", emoji.mainRight || "😊") +
            `\n\n**${ctx.author.username}** is happy with **${target.username}**:\n\n> ${randomSentence}`
        )
        .setFooter({
          text:
            generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Celebrate button
      const celebrateButton = new ButtonBuilder()
        .setCustomId(`celebrate_${ctx.author.id}_${target.id}`)
        .setLabel("Celebrate")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎉");

      const row = new ActionRowBuilder().addComponents(celebrateButton);

      // Send the embed with button
      const message = await ctx.sendMessage({
        embeds: [embed],
        components: [row],
      });

      // Collector for button click
      const collector = message.createMessageComponentCollector({
        filter: (i) => {
          if (i.user.id !== target.id) {
            i.reply({
              content:
                "Only the person you’re happy with can celebrate with you!",
              ephemeral: true,
            });
            return false;
          }
          return true;
        },
        time: 120000, // 2 minutes timeout
      });

      collector.on("collect", async (interaction) => {
        const celebrateMessages = [
          "Yay! Let’s celebrate together! 🎉🥳",
          "So happy to share this moment with you! 😊",
          "You make me smile so much! Thank you! 🎊",
          "Let’s keep spreading this happiness! 🌟",
          "Here’s to more amazing times ahead! 🥂",
          "Your happiness is contagious! 😄",
          "Can’t wait for more fun moments! 🎈",
          "You’re awesome and I’m glad you’re here! 💖",
          "Together, we make a great team! 🤗",
          "Celebrating you right now! 🎉✨",
        ];

        const celebrateReply = client.utils.getRandomElement(celebrateMessages);

        // Embed for celebrate reply
        const celebrateEmbed = client
          .embed()
          .setColor(color.success || "#00FF00")
          .setDescription(
            `**${target.username}** celebrates with **${ctx.author.username}**:\n\n> ${celebrateReply}`
          )
          .setFooter({
            text: `Celebration by ${target.username}`,
            iconURL: target.displayAvatarURL(),
          })
          .setTimestamp();

        // Disable button after use
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(celebrateButton).setDisabled(true)
        );

        await interaction.update({
          embeds: [celebrateEmbed],
          components: [disabledRow],
        });
        collector.stop();
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time" && message.editable) {
          const disabledRow = new ActionRowBuilder().addComponents(
            ButtonBuilder.from(celebrateButton).setDisabled(true)
          );
          try {
            await message.edit({ components: [disabledRow] });
          } catch (err) {
            console.error(
              "Error disabling celebrate button after timeout:",
              err
            );
          }
        }
      });
    } catch (error) {
      console.error("Failed to run cheerful command:", error);
      if (ctx && typeof ctx.sendMessage === "function") {
        await ctx.sendMessage({
          content: "An error occurred while processing your request.",
          ephemeral: true,
        });
      }
    }
  }
};
