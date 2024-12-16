const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Partner extends Command {
    constructor(client) {
        super(client, {
            name: 'partner',
            description: {
                content: 'Manage your partner relationship.',
                examples: [
                    'partner add @user - Adds the mentioned user as your partner.',
                    'partner remove @user - Removes the mentioned user from your partner slot.'
                ],
                usage: 'partner <add/remove> <user>',
            },
            category: 'relationship',
            aliases: [],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'action',
                    description: 'Action to perform: add or remove.',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'Add', value: 'add' },
                        { name: 'Remove', value: 'remove' },
                    ]
                },
                {
                    name: 'user',
                    description: 'The user you want to add or remove as your partner.',
                    type: 6,
                    required: true,
                }
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const relationshipMessages = language.locales.get(language.defaultLocale)?.relationshipMessages;
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0];
        const userToModify = ctx.isInteraction ? ctx.interaction.options.getUser('user')?.id : ctx.message.mentions.users.first()?.id || args[1];

        if (!userToModify) {
            return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.userNotMentioned, color);
        }

        const user = await client.utils.getUser(ctx.author.id);
        const mention = await client.utils.getUser(userToModify);

        if (!user || !mention) {
            return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.notRegistered, color);
        }

        // Check for partner relationship
        if (action === 'add') {
            await this.checkAndAddPartner(client, ctx, user, mention, color, emoji, language);
        } else if (action === 'remove') {
            await this.removePartner(client, ctx, user, mention, color, emoji, language);
        } else {
            return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.invalidAction, color);
        }
    }

    async checkAndAddPartner(client, ctx, user, mention, color, emoji, language) {
        const badgeIds = { r01: 'r02', r02: 'r01' };

        // Check inventories
        const userRing = user.inventory.find((inv) => Object.keys(badgeIds).includes(inv.id));
        const mentionRing = mention.inventory.find((inv) => Object.keys(badgeIds).includes(inv.id));

        if (!userRing) {
            return client.utils.sendErrorMessage(client, ctx, `${ctx.author.displayName}, 𝒚𝒐𝒖 𝒅𝒐𝒏'𝒕 𝒉𝒂𝒗𝒆 𝒂 𝒓𝒊𝒏𝒈.`, color);
        }
        if (!mentionRing) {
            return client.utils.sendErrorMessage(client, ctx, `${mention.username} 𝒅𝒐𝒆𝒔 𝒏𝒐𝒕 𝒉𝒂𝒗𝒆 𝒂 𝒓𝒊𝒏𝒈.`, color);
        }

        // Check ring pairs
        if (badgeIds[userRing.id] !== mentionRing.id) {
            return client.utils.sendErrorMessage(client, ctx, `${ctx.author.displayName} 𝒂𝒏𝒅 ${mention.username} 𝒎𝒖𝒔𝒕 𝒉𝒂𝒗𝒆 𝒄𝒐𝒎𝒑𝒍𝒆𝒎𝒆𝒏𝒕𝒂𝒓𝒚 (𝒓01 𝒂𝒏𝒅 𝒓02).`, color);
        }

        // Check for existing partners
        if (user.partner?.userId) {
            return client.utils.sendErrorMessage(client, ctx, `${ctx.author.displayName}, 𝒚𝒐𝒖 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒉𝒂𝒗𝒆 𝒂 𝒑𝒂𝒓𝒕𝒏𝒆𝒓!`, color);
        }
        if (mention.partner?.userId) {
            return client.utils.sendErrorMessage(client, ctx, `${mention.username} 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒉𝒂𝒔 𝒂 𝒑𝒂𝒓𝒕𝒏𝒆𝒓!`, color);
        }

        // Send confirmation embed to the mentioned user
        const confirmEmbed = client.embed()
            .setColor(color.main)
            .setTitle(`💍 Partner Request`)
            .setDescription(
                `${ctx.author.username} is asking you to become their partner!\n` +
                `You have the complementary ring **(${mentionRing.id.toUpperCase()})** to match theirs.\n` +
                `Do you accept this partnership?`
            )
            .setFooter({ text: 'You have 2 minute to respond.' });

        const acceptedButton = client.utils.labelButton('accept', 'Accept', 3);
        const declineButton = client.utils.labelButton('decline', 'Decline', 4);
        const row = client.utils.createButtonRow(acceptedButton, declineButton)

        const confirmMessage = await ctx.channel.send({ content: '', embeds: [confirmEmbed], components: [row] });

        // Await confirmation response
        const filter = (interaction) =>
            interaction.user.id === mention.id &&
            ['accept', 'decline'].includes(interaction.customId);

        try {
            const collected = await confirmMessage.awaitMessageComponent({ filter, time: 120000 });
            if (collected.customId === 'accept') {
                // Update partner data
                user.partner = { userId: mention.id };
                mention.partner = { userId: ctx.author.id };

                await client.utils.updateUser(ctx.author.id, user); // Save user data
                await client.utils.updateUser(mention.id, mention); // Save mention data

                await collected.update({
                    content: `🎉 **${ctx.author.displayName}** and **${mention.username}** are now partners! 💍`,
                    embeds: [],
                    components: [],
                });
            } else {
                await collected.update({
                    content: `❌ **${mention.username}** declined the partnership request.`,
                    embeds: [],
                    components: [],
                });
            }
        } catch (err) {
            await confirmMessage.edit({
                content: `⌛ **${mention.username}** did not respond in time. Request cancelled.`,
                embeds: [],
                components: [],
            });
        }
    }

    async removePartner(client, ctx, user, mention, color, emoji, language) {
        // Check if user and mention are partners
        if (user.partner?.userId !== mention.id || mention.partner?.userId !== user.id) {
            return client.utils.sendErrorMessage(client, ctx, `You are not partners with ${mention.username}.`, color);
        }

        // Remove partner relationship
        user.partner = null;
        mention.partner = null;

        // Save updated data
        await Users.findByIdAndUpdate(ctx.author.id, user);
        await Users.findByIdAndUpdate(mention.id, mention);

        return client.utils.sendSuccessMessage(client, ctx, `${ctx.author.username} and ${mention.username} are no longer partners. 💔`, color);
    }
};
