const { Command } = require("../../structures/index.js");

const RELATIONSHIP_LIMITS = {
  partner: 1,
  bestie: 10,
  brother: 10,
  sister: 10,
};

module.exports = class Relationship extends Command {
  constructor(client) {
    super(client, {
      name: "relationship",
      description: {
        content: "Manage your relationships (partner, bestie, etc.)",
        examples: [
          "relationship add partner @user",
          "relationship remove bestie @user",
        ],
        usage: "relationship <add/remove> <type> <user>",
      },
      aliases: ["ship", "r"],
      category: "relationship",
      args: true,
      cooldown: 5,
      slashCommand: true,
      options: [
        {
          name: "action",
          description: "Add or Remove relationship",
          type: 3,
          required: true,
          choices: [
            { name: "Add", value: "add" },
            { name: "Remove", value: "remove" },
          ],
        },
        {
          name: "type",
          description: "Relationship type",
          type: 3,
          required: true,
          choices: [
            { name: "Partner", value: "partner" },
            { name: "Bestie", value: "bestie" },
            { name: "Brother", value: "brother" },
            { name: "Sister", value: "sister" },
          ],
        },
        {
          name: "user",
          description: "The user you want to add or remove",
          type: 6,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const action = ctx.isInteraction
      ? ctx.interaction.options.getString("action")
      : args[0];

    const type = ctx.isInteraction
      ? ctx.interaction.options.getString("type")
      : args[1];

    const target = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.users.first() || args[2];

    if (!target) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "You must mention a user.",
        color
      );
    }

    if (target.id === ctx.author.id) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "You cannot choose yourself.",
        color
      );
    }

    const user = await client.utils.getUser(ctx.author.id);
    const mention = await client.utils.getUser(target.id);

    if (!user || !mention) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Both users must be registered.",
        color
      );
    }

    switch (action) {
      case "add":
        await this.addRelationship(
          client,
          ctx,
          user,
          target,
          mention,
          type,
          color
        );
        break;
      case "remove":
        await this.removeRelationship(
          client,
          ctx,
          user,
          target,
          mention,
          type,
          color
        );
        break;
      default:
        return client.utils.sendErrorMessage(
          client,
          ctx,
          "Invalid action provided.",
          color
        );
    }
  }

  async addRelationship(client, ctx, user, target, mention, type, color) {
    const limit = RELATIONSHIP_LIMITS[type];

    if (type === "partner") {
      if (user.relationship?.partner?.userId) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You already have a partner.`,
          color
        );
      }
      if (mention.relationship?.partner?.userId) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `${target.username} already has a partner.`,
          color
        );
      }

      // Add partner both ways
      user.relationship.partner = {
        userId: target.id,
        name: target.username,
        date: new Date(),
        xp: 0,
        level: 1,
      };
      mention.relationship.partner = {
        userId: ctx.author.id,
        name: ctx.author.username,
        date: new Date(),
        xp: 0,
        level: 1,
      };
    } else {
      const existing = user.relationship?.[`${type}s`] || [];
      if (existing.find((rel) => rel.userId === target.id)) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You already added ${target.username} as your ${type}.`,
          color
        );
      }
      if (limit && existing.length >= limit) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You can only have up to ${limit} ${type}s.`,
          color
        );
      }

      user.relationship[`${type}s`].push({
        userId: target.id,
        name: target.username,
        date: new Date(),
        xp: 0,
        level: 1,
      });
    }

    await Promise.all([user.save(), mention.save()]);
    return client.utils.sendSuccessMessage(
      client,
      ctx,
      `🎉 You are now ${type}s with ${target.username}!`,
      color
    );
  }

  async removeRelationship(client, ctx, user, target, mention, type, color) {
    if (type === "partner") {
      if (user.relationship.partner?.userId !== target.id) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You are not partners with ${target.username}.`,
          color
        );
      }
      user.relationship.partner = null;
      mention.relationship.partner = null;
    } else {
      const prevCount = user.relationship[`${type}s`]?.length || 0;
      user.relationship[`${type}s`] = user.relationship[`${type}s`].filter(
        (rel) => rel.userId !== target.id
      );

      if (user.relationship[`${type}s`].length === prevCount) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You don't have ${target.username} as your ${type}.`,
          color
        );
      }
    }

    await Promise.all([user.save(), mention.save()]);
    return client.utils.sendSuccessMessage(
      client,
      ctx,
      `💔 ${target.username} has been removed from your ${type}s.`,
      color
    );
  }
};
