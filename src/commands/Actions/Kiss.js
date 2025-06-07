const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Kiss extends Command {
  constructor(client) {
    super(client, {
      name: "kiss",
      description: {
        content: "Sends a cute kiss to the mentioned user.",
        examples: ["kiss @user"],
        usage: "kiss <user>",
      },
      category: "actions",
      aliases: [],
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
          description: "The user you want to kiss.",
          type: 6, // USER type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      // Default messages for all required properties
      const defaultMessages = {
        generalMessages: {
          title: "%{mainLeft} %{title} %{mainRight}",
          requestedBy: "Requested by %{username}",
        },
        actionMessages: {
          kissMessages: {
            description: "%{displayName} kisses %{target}!",
            errors: {
              noUser: "You need to mention a user to kiss!",
              selfKiss: "You can't kiss yourself!",
            },
            reactions: {
              kiss_back: "Kiss back",
              run: "Run away!",
            },
            kissBack: "%{displayName} kisses %{target} back!",
            runReaction: "%{displayName} runs away from %{target}!",
          },
        },
      };

      // Get messages from language file with fallbacks
      const generalMessages =
        language.locales.get(language.defaultLocale)?.generalMessages ||
        defaultMessages.generalMessages;

      // Get kiss messages with complete fallbacks
      let kissMessages = language.locales.get(language.defaultLocale)
        ?.actionMessages?.kissMessages;

      // If kissMessages is completely undefined, use the default
      if (!kissMessages) {
        kissMessages = defaultMessages.actionMessages.kissMessages;
      } else {
        // Ensure all required properties exist
        kissMessages.description =
          kissMessages.description ||
          defaultMessages.actionMessages.kissMessages.description;
        kissMessages.errors =
          kissMessages.errors ||
          defaultMessages.actionMessages.kissMessages.errors;
        kissMessages.kissBack =
          kissMessages.kissBack ||
          defaultMessages.actionMessages.kissMessages.kissBack;
        kissMessages.runReaction =
          kissMessages.runReaction ||
          defaultMessages.actionMessages.kissMessages.runReaction;

        // Ensure nested objects exist
        if (!kissMessages.reactions) {
          kissMessages.reactions =
            defaultMessages.actionMessages.kissMessages.reactions;
        }
      }

      const errorMessages = kissMessages.errors;

      // Get target user
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() ||
          (await client.users.fetch(args[0]).catch(() => null));

      // Error handling if no user is mentioned or the user kisses themselves
      if (!target) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          errorMessages.noUser,
          color
        );
      }

      if (target.id === ctx.author.id) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          errorMessages.selfKiss,
          color
        );
      }

      // Get random emoji
      const randomEmoji = client.utils.getRandomElement(
        emoji.actions?.kisses ||
          globalEmoji.actions.kisses || ["💋", "😘", "😚"]
      );

      // Create the embed message for kissing
      const embed = client
        .embed()
        .setColor(color.main)
        .setImage(client.utils.emojiToImage(randomEmoji))
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft || "❤️")
            .replace("%{title}", "KISS")
            .replace("%{mainRight}", emoji.mainRight || "❤️") +
            "\n\n" +
            kissMessages.description
              .replace("%{displayName}", `**${ctx.author.displayName}**`)
              .replace("%{target}", `**${target.displayName}**`)
        )
        .setFooter({
          text:
            generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      // Create reaction buttons (only for the target to use)
      const kissBackButton = new ButtonBuilder()
        .setCustomId(`kiss_back_${ctx.author.id}_${target.id}`)
        .setLabel(kissMessages.reactions.kiss_back || "Kiss back")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💋");

      const runButton = new ButtonBuilder()
        .setCustomId(`run_${ctx.author.id}_${target.id}`)
        .setLabel(kissMessages.reactions.run || "Run away!")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🏃");

      const row = new ActionRowBuilder().addComponents(
        kissBackButton,
        runButton
      );

      // Send the message with buttons
      const message = await ctx.sendMessage({
        embeds: [embed],
        components: [row],
      });

      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({
        filter: (i) => {
          // Only the target can interact with the buttons
          if (i.user.id !== target.id) {
            i.reply({
              content: "Only the person who was kissed can use these buttons!",
              flags: 64,
            });
            return false;
          }
          return true;
        },
        time: 60000, // 1 minute timeout
      });

      collector.on("collect", async (interaction) => {
        const [action, authorId, targetId] = interaction.customId.split("_");

        // Create response embed based on action
        const responseEmbed = client.embed().setColor(color.main);

        switch (action) {
          case "kiss":
            responseEmbed
              .setDescription(
                kissMessages.kissBack
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(
                client.utils.emojiToImage(
                  client.utils.getRandomElement(
                    emoji.actions?.kisses ||
                      globalEmoji.actions.kisses || ["💋", "😘", "😚"]
                  )
                )
              );
            break;

          case "run":
            responseEmbed
              .setDescription(
                kissMessages.runReaction
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(client.utils.emojiToImage(emoji.run || "🏃"));
            break;
        }

        // Disable all buttons
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(kissBackButton).setDisabled(true),
          ButtonBuilder.from(runButton).setDisabled(true)
        );

        // Update the message with the response and disabled buttons
        await interaction.update({
          embeds: [responseEmbed],
          components: [disabledRow],
        });

        // Stop the collector since an action was taken
        collector.stop();
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "time" && message.editable) {
          // If no button was pressed, disable all buttons
          try {
            const disabledRow = new ActionRowBuilder().addComponents(
              ButtonBuilder.from(kissBackButton).setDisabled(true),
              ButtonBuilder.from(runButton).setDisabled(true)
            );

            await message.edit({ components: [disabledRow] });
          } catch (error) {
            console.error("Error disabling buttons:", error);
          }
        }
      });
    } catch (error) {
      console.error("Failed to send kiss message:", error);
      await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while executing the command.",
        color
      );
    }
  }
};
