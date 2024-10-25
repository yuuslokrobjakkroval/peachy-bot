const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Bestie extends Command {
    constructor(client) {
        super(client, {
            name: 'bestie',
            description: {
                content: 'Manage your bestie relationships.',
                examples: [
                    'bestie add @user - Adds the mentioned user as one of your besties.',
                    'bestie remove @user - Removes the mentioned user from your besties.'
                ],
                usage: 'bestie <add/remove> <user>',
            },
            category: 'relationship',
            cooldown: 5,
            args: true,
            permissions: {
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
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
                    description: 'The user you want to add or remove as a bestie.',
                    type: 6,
                    required: true,
                }
            ],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const relationshipMessages = language.locales.get(language.defaultLocale)?.profileMessages?.relationshipMessages;
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0];
        const userToModify = ctx.isInteraction ? ctx.interaction.options.getUser('user')?.id : ctx.message.mentions.users.first()?.id || args[1];

        if (!userToModify) {
            return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.userNotMentioned, color);
        }

        Users.findOne({ userId: ctx.author.id })
            .then(userData => {
                if (!userData) return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.notRegistered, color);

                Users.findOne({ userId: userToModify })
                    .then(targetUserData => {
                        if (!targetUserData) return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.targetNotRegistered, color);

                        if (action === 'add') {
                            if (userData.relationship.besties.length >= 4) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.bestie.error.limitExceeded, color);
                            }
                            if (userData.relationship.besties.some(bestie => bestie.id === userToModify)) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.bestie.error.alreadyExists, color);
                            }
                            userData.relationship.besties.push({ id: userToModify, name: targetUserData.username, xp: 0, level: 1 });
                        } else if (action === 'remove') {
                            if (!userData.relationship.besties.some(bestie => bestie.id === userToModify)) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.bestie.error.notFound, color);
                            }
                            userData.relationship.besties = userData.relationship.besties.filter(bestie => bestie.id !== userToModify);
                        }

                        userData.save()
                            .then(() => client.utils.sendSuccessMessage(client, ctx, `${relationshipMessages.success[action]} <@${userToModify}> as your bestie.`, color))
                            .catch(err => console.error(err));
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    }
};
