const { Command } = require("../../structures/index.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MessageFlags,
} = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Kill extends Command {
  constructor(client) {
    super(client, {
      name: "kill",
      description: {
        content: "Sends a cute kill to the mentioned user.",
        examples: ["kill @User"],
        usage: "kill @User",
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
          description: "Mention the user you want to kill.",
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
          killMessages: {
            description: "%{displayName} kills %{target}!",
            errors: {
              noUser: "You need to mention a user to kill!",
              selfKill: "You can't kill yourself!",
            },
            reactions: {
              revive: "Revive",
              haunt: "Haunt them",
            },
            reviveReaction: "%{displayName} comes back to life!",
            hauntReaction:
              "%{displayName} returns as a ghost to haunt %{target}! 👻",
          },
        },
      };

      // Get messages from language file with fallbacks
      const generalMessages =
        language.locales.get(language.defaultLocale)?.generalMessages ||
        defaultMessages.generalMessages;

      // Get kill messages with complete fallbacks
      let killMessages = language.locales.get(language.defaultLocale)
        ?.actionMessages?.killMessages;

      // If killMessages is completely undefined, use the default
      if (!killMessages) {
        killMessages = defaultMessages.actionMessages.killMessages;
      } else {
        // Ensure all required properties exist
        killMessages.description =
          killMessages.description ||
          defaultMessages.actionMessages.killMessages.description;
        killMessages.errors =
          killMessages.errors ||
          defaultMessages.actionMessages.killMessages.errors;

        // Add reaction messages if they don't exist
        if (!killMessages.reactions) {
          killMessages.reactions =
            defaultMessages.actionMessages.killMessages.reactions;
        }

        killMessages.reviveReaction =
          killMessages.reviveReaction ||
          defaultMessages.actionMessages.killMessages.reviveReaction;
        killMessages.hauntReaction =
          killMessages.hauntReaction ||
          defaultMessages.actionMessages.killMessages.hauntReaction;
      }

      const errorMessages = killMessages.errors;

      // Get target user
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() ||
          (await client.users.fetch(args[0]).catch(() => null));

      // Error handling if no user is mentioned or the user kills themselves
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
          errorMessages.selfKill,
          color
        );
      }

      // Get random emoji
      const randomEmoji = client.utils.getRandomElement(
        emoji.actions?.kill || globalEmoji.actions?.kill || ["💀", "🔪", "⚰️"]
      );

      // Create the container with Components v2
      const killContainer = new ContainerBuilder()
        .setAccentColor(color.main)
        .addTextDisplayComponents((text) =>
          text.setContent(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft || "💀")
              .replace("%{title}", "KILL")
              .replace("%{mainRight}", emoji.mainRight || "💀")
          )
        )
        .addSeparatorComponents((sep) => sep)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((text) =>
              text.setContent(
                killMessages.description
                  .replace("%{displayName}", `**${ctx.author.displayName}**`)
                  .replace("%{target}", `**${target.displayName}**`)
              )
            )
            .setThumbnailAccessory((thumb) =>
              thumb
                .setURL(target.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(target.displayName)
            )
        )
        .addSeparatorComponents((sep) => sep.setDivider(false))
        .addMediaGalleryComponents((gallery) =>
          gallery.addItems((item) =>
            item
              .setURL(client.utils.emojiToImage(randomEmoji))
              .setDescription("Kill animation")
          )
        )
        .addSeparatorComponents((sep) => sep)
        .addTextDisplayComponents((text) =>
          text.setContent(
            `*${generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`}*`
          )
        );

      // Create reaction buttons (only for the target to use)
      const reviveButton = new ButtonBuilder()
        .setCustomId(`revive_${ctx.author.id}_${target.id}`)
        .setLabel(killMessages.reactions.revive || "Revive")
        .setStyle(ButtonStyle.Success)
        .setEmoji("💖");

      const hauntButton = new ButtonBuilder()
        .setCustomId(`haunt_${ctx.author.id}_${target.id}`)
        .setLabel(killMessages.reactions.haunt || "Haunt them")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("👻");

      const row = new ActionRowBuilder().addComponents(
        reviveButton,
        hauntButton
      );

      // Send the message with Components v2 and buttons
      const message = await ctx.sendMessage({
        components: [killContainer, row],
        flags: MessageFlags.IsComponentsV2,
      });

      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({
        filter: (i) => {
          // Only the target can interact with the buttons
          if (i.user.id !== target.id) {
            i.reply({
              content: "Only the person who was killed can use these buttons!",
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

        // Determine response details based on action
        let responseDescription = "";
        let responseEmoji = "";
        let responseColor = color.main;

        switch (action) {
          case "revive":
            responseDescription = killMessages.reviveReaction
              .replace("%{displayName}", `**${target.displayName}**`)
              .replace("%{target}", `**${ctx.author.displayName}**`);
            responseEmoji = emoji.revive || "💖";
            responseColor = color.success;
            break;

          case "haunt":
            responseDescription = killMessages.hauntReaction
              .replace("%{displayName}", `**${target.displayName}**`)
              .replace("%{target}", `**${ctx.author.displayName}**`);
            responseEmoji = emoji.ghost || "👻";
            responseColor = color.main;
            break;
        }

        // Create response container with Components v2
        const responseContainer = new ContainerBuilder()
          .setAccentColor(responseColor)
          .addSectionComponents((section) =>
            section
              .addTextDisplayComponents(
                (text) =>
                  text.setContent(
                    `**${target.displayName}** → **${ctx.author.displayName}**`
                  ),
                (text) => text.setContent(responseDescription)
              )
              .setThumbnailAccessory((thumb) =>
                thumb
                  .setURL(
                    ctx.author.displayAvatarURL({ dynamic: true, size: 256 })
                  )
                  .setDescription(ctx.author.displayName)
              )
          )
          .addSeparatorComponents((sep) => sep.setDivider(false))
          .addMediaGalleryComponents((gallery) =>
            gallery.addItems((item) =>
              item
                .setURL(client.utils.emojiToImage(responseEmoji))
                .setDescription("Response animation")
            )
          );

        // Disable all buttons
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(reviveButton).setDisabled(true),
          ButtonBuilder.from(hauntButton).setDisabled(true)
        );

        // Update the message with the response and disabled buttons
        await interaction.update({
          components: [responseContainer, disabledRow],
          flags: MessageFlags.IsComponentsV2,
        });

        // Stop the collector since an action was taken
        collector.stop();
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "time" && message.editable) {
          // If no button was pressed, disable all buttons
          try {
            const disabledRow = new ActionRowBuilder().addComponents(
              ButtonBuilder.from(reviveButton).setDisabled(true),
              ButtonBuilder.from(hauntButton).setDisabled(true)
            );

            await message.edit({
              components: [killContainer, disabledRow],
              flags: MessageFlags.IsComponentsV2,
            });
          } catch (error) {
            console.error("Error disabling buttons:", error);
          }
        }
      });
    } catch (error) {
      console.error("Failed to send kill message:", error);
      await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while executing the command.",
        color
      );
    }
  }
};
