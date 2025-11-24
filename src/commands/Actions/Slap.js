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

module.exports = class Slap extends Command {
  constructor(client) {
    super(client, {
      name: "slap",
      description: {
        content: "Sends a playful slap to the mentioned user.",
        examples: ["slap @User"],
        usage: "slap @User",
      },
      category: "actions",
      aliases: ["smack"],
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
          description: "Mention the user you want to slap.",
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
          slapMessages: {
            description: "%{displayName} slaps %{target}!",
            errors: {
              noUser: "You need to mention a user to slap.",
              selfSlap: "You cannot slap yourself.",
            },
            reactions: {
              slap_back: "Slap back",
              dodge: "Dodge",
              cry: "Cry",
            },
            slapBack: "%{displayName} slaps %{target} back! Ouch!",
            dodgeReaction: "%{displayName} swiftly dodges %{target}'s slap!",
            cryReaction:
              "%{displayName} cries after being slapped by %{target}!",
          },
        },
      };

      // Get messages from language file with fallbacks
      const generalMessages =
        language.locales.get(language.defaultLocale)?.generalMessages ||
        defaultMessages.generalMessages;

      // Get slap messages with complete fallbacks
      let slapMessages = language.locales.get(language.defaultLocale)
        ?.actionMessages?.slapMessages;

      // If slapMessages is completely undefined, use the default
      if (!slapMessages) {
        slapMessages = defaultMessages.actionMessages.slapMessages;
      } else {
        // Ensure all required properties exist
        slapMessages.description =
          slapMessages.description ||
          defaultMessages.actionMessages.slapMessages.description;
        slapMessages.errors =
          slapMessages.errors ||
          defaultMessages.actionMessages.slapMessages.errors;

        // Add reaction messages if they don't exist
        if (!slapMessages.reactions) {
          slapMessages.reactions =
            defaultMessages.actionMessages.slapMessages.reactions;
        }

        slapMessages.slapBack =
          slapMessages.slapBack ||
          defaultMessages.actionMessages.slapMessages.slapBack;
        slapMessages.dodgeReaction =
          slapMessages.dodgeReaction ||
          defaultMessages.actionMessages.slapMessages.dodgeReaction;
        slapMessages.cryReaction =
          slapMessages.cryReaction ||
          defaultMessages.actionMessages.slapMessages.cryReaction;
      }

      const errorMessages = slapMessages.errors;

      // Get target user
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() ||
          (await client.users.fetch(args[0]).catch(() => null));

      // Error handling if no user is mentioned or the user slaps themselves
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
          errorMessages.selfSlap,
          color
        );
      }

      // Get random emoji
      const randomEmoji = client.utils.getRandomElement(
        emoji.actions?.slaps || globalEmoji.actions?.slaps || ["👋", "✋", "💢"]
      );

      // Create the container with Components v2
      const slapContainer = new ContainerBuilder()
        .setAccentColor(color.main)
        .addTextDisplayComponents((text) =>
          text.setContent(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft || "👋")
              .replace("%{title}", "SLAP")
              .replace("%{mainRight}", emoji.mainRight || "👋")
          )
        )
        .addSeparatorComponents((sep) => sep)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((text) =>
              text.setContent(
                slapMessages.description
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
              .setDescription("Slap animation")
          )
        )
        .addSeparatorComponents((sep) => sep)
        .addTextDisplayComponents((text) =>
          text.setContent(
            `*${generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`}*`
          )
        );

      // Create reaction buttons (only for the target to use)
      const slapBackButton = new ButtonBuilder()
        .setCustomId(`slap_back_${ctx.author.id}_${target.id}`)
        .setLabel(slapMessages.reactions.slap_back || "Slap back")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("👋");

      const dodgeButton = new ButtonBuilder()
        .setCustomId(`dodge_${ctx.author.id}_${target.id}`)
        .setLabel(slapMessages.reactions.dodge || "Dodge")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💨");

      const cryButton = new ButtonBuilder()
        .setCustomId(`cry_${ctx.author.id}_${target.id}`)
        .setLabel(slapMessages.reactions.cry || "Cry")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("😢");

      const row = new ActionRowBuilder().addComponents(
        slapBackButton,
        dodgeButton,
        cryButton
      );

      // Send the message with Components v2 and buttons
      const message = await ctx.sendMessage({
        components: [slapContainer, row],
        flags: MessageFlags.IsComponentsV2,
      });

      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({
        filter: (i) => {
          // Only the target can interact with the buttons
          if (i.user.id !== target.id) {
            i.reply({
              content: "Only the person who was slapped can use these buttons!",
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

        // Create response container based on action
        let responseText = "";
        let responseEmoji = "";
        let responseColor = color.main;

        switch (action) {
          case "slap":
            responseText = slapMessages.slapBack
              .replace("%{displayName}", `**${target.displayName}**`)
              .replace("%{target}", `**${ctx.author.displayName}**`);
            responseEmoji = client.utils.getRandomElement(
              emoji.actions?.slaps ||
                globalEmoji.actions?.slaps || ["👋", "✋", "💢"]
            );
            responseColor = color.danger || color.main;
            break;

          case "dodge":
            responseText = slapMessages.dodgeReaction
              .replace("%{displayName}", `**${target.displayName}**`)
              .replace("%{target}", `**${ctx.author.displayName}**`);
            responseEmoji = emoji.dodge || "💨";
            responseColor = color.success || color.main;
            break;

          case "cry":
            responseText = slapMessages.cryReaction
              .replace("%{displayName}", `**${target.displayName}**`)
              .replace("%{target}", `**${ctx.author.displayName}**`);
            responseEmoji = emoji.cry || "😢";
            break;
        }

        // Create response container with Components v2
        const responseContainer = new ContainerBuilder()
          .setAccentColor(responseColor)
          .addTextDisplayComponents((text) =>
            text.setContent(
              generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft || "👋")
                .replace("%{title}", "REACTION")
                .replace("%{mainRight}", emoji.mainRight || "👋")
            )
          )
          .addSeparatorComponents((sep) => sep)
          .addSectionComponents((section) =>
            section
              .addTextDisplayComponents(
                (text) =>
                  text.setContent(
                    `**${target.displayName}** → **${ctx.author.displayName}**`
                  ),
                (text) => text.setContent(responseText)
              )
              .setThumbnailAccessory((thumb) =>
                thumb
                  .setURL(
                    ctx.author.displayAvatarURL({ dynamic: true, size: 256 })
                  )
                  .setDescription(ctx.author.displayName)
              )
          )
          .addSeparatorComponents((sep) => sep.setDivider(false));

        // Only add media gallery if emoji is a custom Discord emoji
        const emojiImageURL = client.utils.emojiToImage(responseEmoji);
        if (emojiImageURL) {
          responseContainer.addMediaGalleryComponents((gallery) =>
            gallery.addItems((item) =>
              item.setURL(emojiImageURL).setDescription("Reaction animation")
            )
          );
        }

        // Disable all buttons
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(slapBackButton).setDisabled(true),
          ButtonBuilder.from(dodgeButton).setDisabled(true),
          ButtonBuilder.from(cryButton).setDisabled(true)
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
              ButtonBuilder.from(slapBackButton).setDisabled(true),
              ButtonBuilder.from(dodgeButton).setDisabled(true),
              ButtonBuilder.from(cryButton).setDisabled(true)
            );

            await message.edit({
              components: [slapContainer, disabledRow],
              flags: MessageFlags.IsComponentsV2,
            });
          } catch (error) {
            console.error("Error disabling buttons:", error);
          }
        }
      });
    } catch (error) {
      console.error("Failed to send slap message:", error);
      await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while executing the command.",
        color
      );
    }
  }
};
