const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const globalEmoji = require("../../utils/Emoji");
const Users = require("../../schemas/user");

module.exports = class Bite extends Command {
  constructor(client) {
    super(client, {
      name: "bite",
      description: {
        content: "Playfully bites the mentioned user.",
        examples: ["bite @User"],
        usage: "bite @User",
      },
      category: "actions",
      aliases: ["chomp", "nibble"],
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
          description: "Mention the user you want to bite.",
          type: 6, // USER type
          required: true,
        },
        {
          name: "intensity",
          description: "How hard do you want to bite?",
          type: 3, // STRING type
          required: false,
          choices: [
            { name: "Gentle nibble", value: "gentle" },
            { name: "Playful bite", value: "playful" },
            { name: "Chomp!", value: "hard" },
          ],
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
          biteMessages: {
            description: "%{displayName} bites %{target}!",
            errors: {
              noUser: "You need to mention a user to bite!",
              selfBite: "You can't bite yourself!",
            },
            intensities: {
              gentle: "%{displayName} gives %{target} a gentle nibble!",
              playful: "%{displayName} playfully bites %{target}!",
              hard: "%{displayName} chomps down on %{target}! Ouch!",
            },
            reactions: {
              bite_back: "Bite back",
              pat: "Pat them",
              run: "Run away!",
            },
            biteBack: "%{displayName} bites %{target} back!",
            patReaction:
              "%{displayName} pats %{target} on the head instead of biting back.",
            runReaction: "%{displayName} runs away from %{target}!",
          },
        },
      };

      // Get messages from language file with fallbacks
      const generalMessages =
        language.locales.get(language.defaultLocale)?.generalMessages ||
        defaultMessages.generalMessages;

      // Get bite messages with complete fallbacks
      let biteMessages = language.locales.get(language.defaultLocale)
        ?.actionMessages?.biteMessages;

      // If biteMessages is completely undefined, use the default
      if (!biteMessages) {
        biteMessages = defaultMessages.actionMessages.biteMessages;
      } else {
        // Ensure all required properties exist
        biteMessages.description =
          biteMessages.description ||
          defaultMessages.actionMessages.biteMessages.description;
        biteMessages.errors =
          biteMessages.errors ||
          defaultMessages.actionMessages.biteMessages.errors;
        biteMessages.biteBack =
          biteMessages.biteBack ||
          defaultMessages.actionMessages.biteMessages.biteBack;
        biteMessages.patReaction =
          biteMessages.patReaction ||
          defaultMessages.actionMessages.biteMessages.patReaction;
        biteMessages.runRe =
          biteMessages.patReaction ||
          defaultMessages.actionMessages.biteMessages.patReaction;
        biteMessages.runReaction =
          biteMessages.runReaction ||
          defaultMessages.actionMessages.biteMessages.runReaction;

        // Ensure nested objects exist
        if (!biteMessages.intensities) {
          biteMessages.intensities =
            defaultMessages.actionMessages.biteMessages.intensities;
        }

        if (!biteMessages.reactions) {
          biteMessages.reactions =
            defaultMessages.actionMessages.biteMessages.reactions;
        }
      }

      const errorMessages = biteMessages.errors;

      // Get target user
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() ||
          (await client.users.fetch(args[0]).catch(() => null));

      // Error handling if no user is mentioned or the user bites themselves
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
          errorMessages.selfBite,
          color
        );
      }

      // Get bite intensity (default to playful)
      const intensity = ctx.isInteraction
        ? ctx.interaction.options.getString("intensity") || "playful"
        : args[1] || "playful";

      // Get random emoji based on intensity
      const biteEmojis = emoji.actions?.bites ||
        globalEmoji.actions?.bites || ["😬", "🦷", "😁"];
      const gentleEmojis =
        biteEmojis.filter(
          (e) => e.includes && (e.includes("gentle") || e.includes("nibble"))
        ).length > 0
          ? biteEmojis.filter(
              (e) =>
                e.includes && (e.includes("gentle") || e.includes("nibble"))
            )
          : biteEmojis;
      const hardEmojis =
        biteEmojis.filter(
          (e) => e.includes && (e.includes("hard") || e.includes("chomp"))
        ).length > 0
          ? biteEmojis.filter(
              (e) => e.includes && (e.includes("hard") || e.includes("chomp"))
            )
          : biteEmojis;

      let randomEmoji;
      switch (intensity) {
        case "gentle":
          randomEmoji = client.utils.getRandomElement(gentleEmojis);
          break;
        case "hard":
          randomEmoji = client.utils.getRandomElement(hardEmojis);
          break;
        default:
          randomEmoji = client.utils.getRandomElement(biteEmojis);
      }

      // Get bite message based on intensity
      const biteMessage =
        biteMessages.intensities[intensity] || biteMessages.description;

      // Create the embed message for biting
      const embed = client
        .embed()
        .setColor(color.main)
        .setImage(client.utils.emojiToImage(randomEmoji))
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft || "🧡")
            .replace("%{title}", "BITE")
            .replace("%{mainRight}", emoji.mainRight || "🧡") +
            "\n\n" +
            biteMessage
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
      const biteBackButton = new ButtonBuilder()
        .setCustomId(`bite_back_${ctx.author.id}_${target.id}`)
        .setLabel(biteMessages.reactions.bite_back || "Bite back")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🦷");

      const patButton = new ButtonBuilder()
        .setCustomId(`pat_${ctx.author.id}_${target.id}`)
        .setLabel(biteMessages.reactions.pat || "Pat them")
        .setStyle(ButtonStyle.Success)
        .setEmoji("👋");

      const runButton = new ButtonBuilder()
        .setCustomId(`run_${ctx.author.id}_${target.id}`)
        .setLabel(biteMessages.reactions.run || "Run away!")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🏃");

      const row = new ActionRowBuilder().addComponents(
        biteBackButton,
        patButton,
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
              content: "Only the person who was bitten can use these buttons!",
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
          case "bite":
            responseEmbed
              .setDescription(
                biteMessages.biteBack
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(
                client.utils.emojiToImage(
                  client.utils.getRandomElement(biteEmojis)
                )
              );
            break;

          case "pat":
            responseEmbed
              .setDescription(
                biteMessages.patReaction
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(client.utils.emojiToImage(emoji.pat || "👋"));
            break;

          case "run":
            responseEmbed
              .setDescription(
                biteMessages.runReaction
                  .replace("%{displayName}", `**${target.displayName}**`)
                  .replace("%{target}", `**${ctx.author.displayName}**`)
              )
              .setImage(client.utils.emojiToImage(emoji.run || "🏃"));
            break;
        }

        // Disable all buttons
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(biteBackButton).setDisabled(true),
          ButtonBuilder.from(patButton).setDisabled(true),
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
              ButtonBuilder.from(biteBackButton).setDisabled(true),
              ButtonBuilder.from(patButton).setDisabled(true),
              ButtonBuilder.from(runButton).setDisabled(true)
            );

            await message.edit({ components: [disabledRow] });
          } catch (error) {
            console.error("Error disabling buttons:", error);
          }
        }
      });
    } catch (error) {
      console.error("Failed to send bite message:", error);
      await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while executing the command.",
        color
      );
    }
  }
};
