const { Command } = require("../../structures");
const axios = require("axios");
const globalConfig = require("../../utils/Config");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Emoji extends Command {
  constructor(client) {
    super(client, {
      name: "emoji",
      description: {
        content: "Manage emojis for the bot.",
        examples: ["emoji get", "emoji add", "emoji remove"],
        usage: "emoji <get|add|remove>",
      },
      category: "developer",
      aliases: ["ae"],
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "get",
          description: "Get all emojis",
          type: 1,
        },
        {
          name: "add",
          description: "Add a new emoji",
          type: 1,
          options: [
            {
              name: "emoji",
              description: "Image attachment for adding emoji",
              type: 11,
              required: true,
            },
            {
              name: "name",
              description: "Name for the emoji",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "remove",
          description: "Remove an existing emoji",
          type: 1,
          options: [
            {
              name: "emojiid",
              description: "Emoji ID to remove",
              type: 3,
              required: true,
            },
          ],
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", globalEmoji.searching),
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", globalEmoji.searching),
      );
    }

    try {
      let action = args[0]?.toLowerCase();
      if (ctx.isInteraction) {
        if (ctx.interaction.options.getSubcommand() === "add") {
          action = "add";
        } else if (ctx.interaction.options.getSubcommand() === "remove") {
          action = "remove";
        } else if (ctx.interaction.options.getSubcommand() === "get") {
          action = "get";
        }
      }
      switch (action) {
        case "get":
          // Get all emojis
          const getResponse = await axios.get(
            `https://discord.com/api/v10/applications/${globalConfig.clientId}/emojis`,
            {
              headers: {
                Authorization: `Bot ${globalConfig.token}`,
              },
            },
          );

          const emojis =
            getResponse.data
              .map((e) => `<:${e.name}:${e.id}> (${e.id})`)
              .join("\n") || "No emojis found";
          const chunks = client.utils.chunk(emojis, 10);
          const pages = chunks.map((chunk, index) =>
            client
              .embed()
              .setColor(color.main)
              .setDescription(chunk.join("\n\n"))
              .setFooter({ text: `Page ${index + 1} of ${chunks.length}` }),
          );

          return await client.utils.reactionPaginate(ctx, pages);

        case "add":
          const attachment = ctx.isInteraction
            ? ctx.interaction.options.getAttachment("emoji")
            : args[1];
          const name = ctx.isInteraction
            ? ctx.interaction.options.getString("name")
            : args[2];

          const res = await axios.get(attachment.url, {
            responseType: "arraybuffer",
          });
          const buffer = Buffer.from(res.data, "binary");
          const base64Image = buffer.toString("base64");

          const addResponse = await axios.post(
            `https://discord.com/api/v10/applications/${globalConfig.clientId}/emojis`,
            {
              name: name,
              image: `data:image/jpeg;base64,${base64Image}`,
            },
            {
              headers: {
                Authorization: `Bot ${globalConfig.token}`,
                "content-type": "application/json",
              },
            },
          );

          return ctx.isInteraction
            ? await ctx.interaction.editReply({
                content: `<:${addResponse.data.name}:${addResponse.data.id}> Created new emoji!\nUse \`<:${addResponse.data.name}:${addResponse.data.id}>\` in your code`,
                fetchReply: true,
              })
            : await ctx.editMessage({
                content: `<:${addResponse.data.name}:${addResponse.data.id}> Created new emoji!\nUse \`<:${addResponse.data.name}:${addResponse.data.id}>\` in your code`,
                fetchReply: true,
              });

        case "remove":
          const emojiId = ctx.isInteraction
            ? ctx.interaction.options.getString("emojiid")
            : args[1];

          if (!emojiId) {
            return ctx.reply(ctx, "Please provide an emoji ID to remove");
          }

          await axios.delete(
            `https://discord.com/api/v10/applications/${globalConfig.clientId}/emojis/${emojiId}`,
            {
              headers: {
                Authorization: `Bot ${globalConfig.token}`,
              },
            },
          );

          return ctx.isInteraction
            ? await ctx.interaction.editReply({
                content: `Successfully removed emoji with ID: ${emojiId}`,
                fetchReply: true,
              })
            : await ctx.editMessage({
                content: `Successfully removed emoji with ID: ${emojiId}`,
                fetchReply: true,
              });

        default:
          await this.reply(ctx, "Invalid action. Use: get, add, or remove");
          break;
      }
    } catch (error) {
      console.error(error);
      await this.reply(ctx, "An error occurred while processing your request");
    }
  }

  async reply(ctx, content) {
    if (ctx.isInteraction) {
      await ctx.interaction.editReply({ content });
    } else {
      await ctx.editMessage({ content });
    }
  }
};
