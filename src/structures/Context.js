const { ChatInputCommandInteraction, Message } = require('discord.js');

module.exports = class Context {
    constructor(ctx, args) {
        this.ctx = ctx;
        this.interaction = this.ctx instanceof ChatInputCommandInteraction ? this.ctx : null;
        this.message = this.ctx instanceof Message ? this.ctx : null;
        this.channel = this.ctx.channel;
        this.id = ctx.id;
        this.channelId = ctx.channelId;
        this.client = ctx.client;
        this.author = ctx instanceof Message ? ctx.author : ctx.user;
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
        this.args = this.isInteraction ? args.map(arg => arg.value) : args;
    }

    sendMessage(content) {
        if (this.isInteraction) {
            this.msg = this.interaction.reply(content)
                .then(response => this.msg = response)
                .catch(err => console.error("Error sending interaction reply:", err));
            return this.msg;
        } else {
            this.msg = this.message.channel.send(content)
                .then(response => this.msg = response)
                .catch(err => console.error("Error sending message:", err));
        }
        return this.msg;
    }

    editMessage(content) {
        if (this.isInteraction) {
            if (this.interaction.deferred || this.interaction.replied) {
                this.msg = this.interaction.editReply(content)
                    .then(response => this.msg = response)
                    .catch(err => console.error("Error editing interaction reply:", err));
            }
        } else if (this.msg && typeof this.msg.edit === 'function') {
            this.msg = this.msg.edit(content)
                .then(response => this.msg = response)
                .catch(err => console.error("Error editing message:", err));
        }
        return this.msg;
    }

    sendDeferMessage(content) {
        if (this.isInteraction) {
            if (!this.interaction.deferred) {
                this.interaction.deferReply({ fetchReply: true })
                    .then(() => this.interaction.editReply(content)
                        .then(response => this.msg = response)
                        .catch(err => console.error("Error editing deferred interaction reply:", err)))
                    .catch(err => console.error("Error deferring interaction reply:", err));
            }
        } else if (this.message) {
            this.msg = this.message.channel.send(content)
                .then(response => this.msg = response)
                .catch(err => console.error("Error sending deferred message:", err));
        }
        return this.msg;
    }

    sendFollowUp(content) {
        if (this.isInteraction) {
            this.msg = this.interaction.followUp(content)
                .then(response => this.msg = response)
                .catch(err => console.error("Error sending follow-up interaction reply:", err));
        } else if (this.message) {
            this.msg = this.message.channel.send(content)
                .then(response => this.msg = response)
                .catch(err => console.error("Error sending follow-up message:", err));
        }
        return this.msg;
    }

    get deferred() {
        return this.isInteraction ? this.interaction.deferred : !!this.msg;
    }
}
