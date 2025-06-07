const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Hug extends Command {
  constructor(client) {
    super(client, {
      name: "hug",
      description: {
        content: "Sends a cute hug to the mentioned user.",
        examples: ["hug @user"],
        usage: "hug @user",
      },
      category: "actions",
      aliases: [],
      cooldown: 3,
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
          description: "Mention the user you want to hug.",
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
          hugMessages: {
            description: "%{displayName} hugs %{target}!",
            errors: {
              noUser: "You need to mention a user to hug!",
              selfHug: "You can't hug yourself!",
            },
            reactions: {
              hug_back: "Hug back",
              pat: "Pat them",
              blush: "Blush",
            },
            hugBack: "%{displayName} hugs %{target} back!",
            patReaction: "%{displayName} pats %{target} on the head!",
            blushReaction: "%{displayName} blushes from %{target}'s hug!",
          },
        },
      };

      // Get messages from language file with fallbacks
      const generalMessages =
        language.locales.get(language.defaultLocale)?.generalMessages ||
        defaultMessages.generalMessages;

      // Get hug messages with complete fallbacks
      let hugMessages = language.locales.get(language.defaultLocale)
        ?.actionMessages?.hugMessages;

      // If hugMessages is completely undefined, use the default
      if (!hugMessages) {
        hugMessages = defaultMessages.actionMessages.hugMessages;
      } else {
        // Ensure all required properties exist
        hugMessages.description =
          hugMessages.description ||
          defaultMessages.actionMessages.hugMessages.description;
        hugMessages.errors =
          hugMessages.errors ||
          defaultMessages.actionMessages.hugMessages.errors;

        // Add reaction messages if they don't exist
        if (!hugMessages.reactions) {
          hugMessages.reactions =
            defaultMessages.actionMessages.hugMessages.reactions;
        }

        hugMessages.hugBack =
          hugMessages.hugBack ||
          defaultMessages.actionMessages.hugMessages.hugBack;
        hugMessages.patReaction =
          hugMessages.patReaction ||
          defaultMessages.actionMessages.hugMessages.patReaction;
        hugMessages.blushReaction =
          hugMessages.blushReaction ||
          defaultMessages.actionMessages.hugMessages.blushReaction;
      }

      const errorMessages = hugMessages.errors;

      // Get target user
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() ||
          (await client.users.fetch(args[0]).catch(() => null));

      // Error handling if no user is mentioned or the user hugs themselves
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
          errorMessages.selfHug,
          color
        );
      }

      // Get random emoji
      const randomEmoji = client.utils.getRandomElement(
        emoji.actions?.hugs || globalEmoji.actions?.hugs || ["🤗", "🫂", "💕"]
      );

      // Create the embed message for hugging
      const embed = client
        .embed()
        .setColor(color.main)
        .setImage(client.utils.emojiToImage(randomEmoji))
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft || "💖")
            .replace("%{title}", "HUG")
            .replace("%{mainRight}", emoji.mainRight || "💖") +
            "\n\n" +
            hugMessages.description
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
      const hugBackButton = new ButtonBuilder()
        .setCustomId(`hug_back_${ctx.author.id}_${target.id}`)
        .setLabel(hugMessages.reactions.hug_back || "Hug back")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🫂");

      const patButton = new ButtonBuilder()
        .setCustomId(`pat_${ctx.author.id}_${target.id}`)
        .setLabel(hugMessages.reactions.pat || "Pat them")
        .setStyle(ButtonStyle.Success)
        .setEmoji("👋");

      const blushButton = new ButtonBuilder()
        .setCustomId(`blush_${ctx.author.id}_${target.id}`)
        .setLabel(hugMessages.reactions.blush || "Blush")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("😊");

      const row = new ActionRowBuilder().addComponents(
        hugBackButton,
        patButton,
        blushButton
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
              content: "Only the person who was hugged can use these buttons!",
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
          case "hug":
            responseEmbed
              .setDescription(
                hugMessages.hugBack
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(
                client.utils.emojiToImage(
                  client.utils.getRandomElement(
                    emoji.actions?.hugs ||
                      globalEmoji.actions?.hugs || ["🤗", "🫂", "💕"]
                  )
                )
              );
            break;

          case "pat":
            responseEmbed
              .setDescription(
                hugMessages.patReaction
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(client.utils.emojiToImage(emoji.pat || "👋"));
            break;

          case "blush":
            responseEmbed
              .setDescription(
                hugMessages.blushReaction
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(client.utils.emojiToImage(emoji.blush || "😊"));
            break;
        }

        // Disable all buttons
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(hugBackButton).setDisabled(true),
          ButtonBuilder.from(patButton).setDisabled(true),
          ButtonBuilder.from(blushButton).setDisabled(true)
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
              ButtonBuilder.from(hugBackButton).setDisabled(true),
              ButtonBuilder.from(patButton).setDisabled(true),
              ButtonBuilder.from(blushButton).setDisabled(true)
            );

            await message.edit({ components: [disabledRow] });
          } catch (error) {
            console.error("Error disabling buttons:", error);
          }
        }
      });
    } catch (error) {
      console.error("Failed to send hug message:", error);
      await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while executing the command.",
        color
      );
    }
  }
};
