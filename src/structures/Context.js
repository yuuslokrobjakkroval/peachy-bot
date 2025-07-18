const { ChatInputCommandInteraction, Message } = require("discord.js");

module.exports = class Context {
  constructor(ctx, args) {
    this.channel = null;
    this.ctx = ctx;
    this.interaction =
      this.ctx instanceof ChatInputCommandInteraction ? this.ctx : null;
    this.message = this.ctx instanceof Message ? this.ctx : null;
    this.channel = this.ctx.channel;
    this.id = ctx.id;
    this.channelId = ctx.channelId;
    this.client = ctx.client;
    this.author = ctx instanceof Message ? ctx.author : ctx.user;
    this.channel = ctx.channel;
    this.guild = ctx.guild;
    this.createdAt = ctx.createdAt;
    this.createdTimestamp = ctx.createdTimestamp;
    this.member = ctx.member;
    this.setArgs(args);
  }

  get isInteraction() {
    return this.ctx instanceof ChatInputCommandInteraction;
  }

  setArgs(args) {
    if (this.isInteraction) {
      this.args = args.map((arg) => arg.value);
    } else {
      this.args = args;
    }
  }

  async sendMessage(content, options = {}) {
    const { dm = false, reply = true } = options;

    // Slash command interaction
    if (this.isInteraction && this.interaction?.replied !== true) {
      this.msg = await this.interaction.reply({ ...content, fetchReply: true });
      return this.msg;
    }

    // Handle already replied interaction (fallback)
    if (this.isInteraction && this.interaction?.replied === true) {
      this.msg = await this.interaction.followUp({
        ...content,
        fetchReply: true,
      });
      return this.msg;
    }

    // If DM is requested
    if (dm) {
      try {
        const dmChannel = await this.author.createDM();
        this.msg = await dmChannel.send(content);
        return this.msg;
      } catch (err) {
        console.error("Failed to send DM:", err);
        throw new Error("I couldn't send a DM to this user.");
      }
    }

    // Message command (reply if possible)
    if (this.message && this.message.channel) {
      if (reply && this.message?.reference) {
        // Reply to the referenced message if exists
        this.msg = await this.message.reply(content);
      } else {
        // Otherwise, just send to the channel
        this.msg = await this.message.channel.send(content);
      }
      return this.msg;
    }

    // Fallback (unknown context)
    throw new Error("Could not determine how to send the message.");
  }

  async editMessage(content) {
    try {
      if (this.isInteraction) {
        // If this is an interaction and has already replied
        if (this.msg) {
          this.msg = await this.msg.edit(content); // editing a follow-up message
          return this.msg;
        } else if (this.interaction.replied || this.interaction.deferred) {
          // Edit initial interaction reply
          this.msg = await this.interaction.editReply(content);
          return this.msg;
        } else {
          throw new Error("Interaction has not been replied or deferred yet.");
        }
      } else {
        // If it's a normal message reply
        if (this.msg) {
          this.msg = await this.msg.edit(content);
          return this.msg;
        } else {
          throw new Error("No message to edit.");
        }
      }
    } catch (err) {
      console.error("Failed to edit message:", err);
      throw err;
    }
  }

  async sendDeferMessage(content = null) {
    if (this.isInteraction) {
      // Defer only if not already replied or deferred
      if (!this.interaction.deferred && !this.interaction.replied) {
        this.msg = await this.interaction.deferReply({ fetchReply: true });
      }

      // If additional content is provided after deferral
      if (content) {
        this.msg = await this.interaction.editReply(content);
      }

      return this.msg;
    } else {
      // Regular message command
      this.msg = await this.message.channel.send(content);
      return this.msg;
    }
  }

  async sendFollowUp(content) {
    if (this.isInteraction) {
      const followUpMsg = await this.interaction.followUp({
        ...content,
        fetchReply: true,
      });
      this.msg = followUpMsg;
      return this.msg;
    } else {
      this.msg = await this.message.channel.send(content);
      return this.msg;
    }
  }

  get deferred() {
    if (this.isInteraction) {
      // Return true if interaction has been deferred or already replied
      return this.interaction.deferred || this.interaction.replied;
    }

    // For traditional message commands, return true if a message was already sent
    return !!this.msg;
  }
};
