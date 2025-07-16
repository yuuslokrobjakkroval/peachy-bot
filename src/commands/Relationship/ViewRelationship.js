const { Command } = require("../../structures/index.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class ViewRelationship extends Command {
  constructor(client) {
    super(client, {
      name: "viewrelationship",
      description: {
        content: "View your relationships or someone else's.",
        examples: ["viewrelationship", "viewrelationship bestie @user"],
        usage: "viewrelationship [type] [@user]",
      },
      category: "relationship",
      aliases: ["vr", "relationshipinfo"],
      cooldown: 5,
      args: false,
      slashCommand: true,
      options: [
        {
          name: "type",
          description: "Type of relationship to show",
          type: 3,
          required: false,
          choices: [
            { name: "All", value: "all" },
            { name: "Partner", value: "partner" },
            { name: "Bestie", value: "bestie" },
            { name: "Brother", value: "brother" },
            { name: "Sister", value: "sister" },
          ],
        },
        {
          name: "user",
          description: "User to view (optional)",
          type: 6,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color) {
    const type = ctx.isInteraction
      ? ctx.interaction.options.getString("type") || "all"
      : args[0]?.toLowerCase() || "all";

    const target = ctx.isInteraction
      ? ctx.interaction.options.getUser("user") || ctx.author
      : ctx.message.mentions.users.first() || ctx.author;

    const user = await client.utils.getUser(target.id);
    if (!user) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        `${target.username} is not registered.`,
        color.main
      );
    }

    const rel = user.relationship || {};

    const embed = new EmbedBuilder()
      .setColor(color.main)
      .setAuthor({
        name: `${target.username}'s Relationships`,
        iconURL: target.displayAvatarURL(),
      })
      .setFooter({ text: "Use /relationship to manage them." });

    const formatOne = (r) =>
      `• <@${r.userId}> (Lv. ${r.level}, XP: ${
        r.xp
      })\n  — Since: <t:${Math.floor(new Date(r.date).getTime() / 1000)}:d>`;

    const formatList = (list) =>
      list?.length ? list.map((r) => formatOne(r)).join("\n") : "None";

    const fields = [];

    if (type === "all" || type === "partner") {
      fields.push({
        name: "💍 Partner",
        value: rel.partner?.userId ? formatOne(rel.partner) : "None",
      });
    }

    if (type === "all" || type === "bestie") {
      fields.push({
        name: "💖 Besties",
        value: formatList(rel.besties || []),
      });
    }

    if (type === "all" || type === "brother") {
      fields.push({
        name: "👬 Brothers",
        value: formatList(rel.brothers || []),
      });
    }

    if (type === "all" || type === "sister") {
      fields.push({
        name: "👭 Sisters",
        value: formatList(rel.sisters || []),
      });
    }

    embed.addFields(...fields);

    return ctx.sendMessage({ embeds: [embed] });
  }
};
