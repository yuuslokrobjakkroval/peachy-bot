const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Sister extends Command {
    constructor(client) {
        super(client, {
            name: 'sister',
            description: {
                content: 'Manage your sister relationships.',
                examples: [
                    'sister add @user - Adds the mentioned user as one of your sisters.',
                    'sister remove @user - Removes the mentioned user from your sisters.'
                ],
                usage: 'sister <add/remove> <user>',
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
                    description: 'The user you want to add or remove as a sister.',
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
                            if (userData.relationship.sisters.length >= 4) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.sister.error.limitExceeded, color);
                            }
                            if (userData.relationship.sisters.some(sister => sister.id === userToModify)) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.sister.error.alreadyExists, color);
                            }
                            userData.relationship.sisters.push({ id: userToModify, name: targetUserData.username, xp: 0, level: 1 });
                        } else if (action === 'remove') {
                            if (!userData.relationship.sisters.some(sister => sister.id === userToModify)) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.sister.error.notFound, color);
                            }
                            userData.relationship.sisters = userData.relationship.sisters.filter(sister => sister.id !== userToModify);
                        }

                        userData.save()
                            .then(() => client.utils.sendSuccessMessage(client, ctx, `${relationshipMessages.success[action]} <@${userToModify}> as your sister.`, color))
                            .catch(err => console.error(err));
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    }
};
