const { ChatInputCommandInteraction, Message } = require('discord.js');

module.exports = class Context {
    constructor(ctx, args) {
        this.channel = null;
        this.ctx = ctx;
        this.interaction = this.ctx instanceof ChatInputCommandInteraction ? this.ctx : null;
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
            this.args = args.map(arg => arg.value);
        } else {
            this.args = args;
        }
    }

    sendMessage(content) {
        if (this.isInteraction) {
            return this.interaction.reply(content)
                .then(() => this.interaction.fetchReply()) // Fetch the actual message object
                .then((msg) => {
                    this.msg = msg; // Assign the fetched message to `this.msg`
                    return this.msg;
                })
                .catch(console.error); // Catch any errors in interaction handling
        } else {
            return this.message.channel.send(content)
                .then((msg) => {
                    this.msg = msg; // Assign the sent message to `this.msg`
                    return this.msg;
                })
                .catch(console.error); // Catch any errors in message sending
        }
    }

    editMessage(content) {
        if (this.isInteraction) {
            return this.msg
                .then((msg) => {
                    return this.interaction.editReply(content).catch(console.error); // Edit the interaction reply
                })
                .catch(console.error); // Catch any errors in fetching/editing
        } else {
            if (this.msg) {
                return this.msg.edit(content).catch(console.error); // Edit the message directly
            }
        }
    }


    async sendDeferMessage(content) {
        if (this.isInteraction) {
            this.msg = await this.interaction.deferReply({ fetchReply: true });
            return this.msg;
        } else {
            this.msg = await this.message.channel.send(content);
            return this.msg;
        }
    }

    async sendFollowUp(content) {
        if (this.isInteraction) {
            await this.interaction.followUp(content);
        } else {
            this.msg = await this.message.channel.send(content);
        }
    }

    get deferred() {
        if (this.isInteraction) {
            return this.interaction.deferred;
        }
        if (this.msg) return true;
        return false;
    }
}
