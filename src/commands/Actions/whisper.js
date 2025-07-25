const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const globalEmoji = require("../../utils/Emoji.js");

module.exports = class Whisper extends Command {
  constructor(client) {
    super(client, {
      name: "whisper",
      description: {
        content: "Whisper a secret message to another user privately.",
        examples: ["whisper @User You have a secret admirer!"],
        usage: "whisper @User <message>",
      },
      category: "actions",
      aliases: ["secret", "tell", "pm"],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: [
          "SendMessages",
          "ViewChannel",
          "EmbedLinks",
          "ReadMessageHistory",
        ],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user you want to whisper to",
          type: 6, // USER type
          required: true,
        },
        {
          name: "message",
          description: "The secret message you want to whisper",
          type: 3, // STRING type
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

      // Get target user and message from options or args
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() ||
          (await client.users.fetch(args[0]).catch(() => null));

      const whisperMessage = ctx.isInteraction
        ? ctx.interaction.options.getString("message")
        : args.slice(1).join(" ");

      if (!target) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          "You must mention a user to whisper to.",
          color
        );
      }

      if (!whisperMessage) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          "Please provide a message to whisper.",
          color
        );
      }

      if (target.id === ctx.author.id) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          "You can't whisper to yourself!",
          color
        );
      }

      // Create embed to send initially (hidden message)
      const initialEmbed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft || "🤫")
            .replace("%{title}", "WHISPER")
            .replace("%{mainRight}", emoji.mainRight || "🤫") +
            `\n\n**${target.username}**, you have a whisper from **${ctx.author.username}**! Click the button below to reveal it.`
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

      // Button to reveal the whisper
      const revealButton = new ButtonBuilder()
        .setCustomId(`whisper_reveal_${ctx.author.id}_${target.id}`)
        .setLabel("Reveal Whisper")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🤫");

      const row = new ActionRowBuilder().addComponents(revealButton);

      // Send the initial message with the button
      const message = await ctx.sendMessage({
        embeds: [initialEmbed],
        components: [row],
      });

      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({
        filter: (i) => {
          if (i.user.id !== target.id) {
            i.reply({
              content: "Only the whispered user can reveal this message!",
              ephemeral: true,
            });
            return false;
          }
          return true;
        },
        time: 120000, // 2 minutes timeout
      });

      collector.on("collect", async (interaction) => {
        // Reveal the whispered message publicly in a new embed
        const revealEmbed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft || "🤫")
              .replace("%{title}", "WHISPER REVEALED")
              .replace("%{mainRight}", emoji.mainRight || "🤫") +
              `\n\n**${ctx.author.username}** whispered to **${target.username}**:\n\n> ${whisperMessage}`
          )
          .setFooter({
            text: `Whisper revealed by ${target.username}`,
            iconURL: target.displayAvatarURL(),
          })
          .setTimestamp();

        // Disable button after reveal
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(revealButton).setDisabled(true)
        );

        await interaction.update({
          embeds: [revealEmbed],
          components: [disabledRow],
        });

        collector.stop();
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time" && message.editable) {
          // Disable button after timeout
          const disabledRow = new ActionRowBuilder().addComponents(
            ButtonBuilder.from(revealButton).setDisabled(true)
          );
          try {
            await message.edit({ components: [disabledRow] });
          } catch (err) {
            console.error("Error disabling whisper button after timeout:", err);
          }
        }
      });
    } catch (error) {
      console.error("Failed to send whisper message:", error);
      await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while executing the command.",
        color
      );
    }
  }
};
