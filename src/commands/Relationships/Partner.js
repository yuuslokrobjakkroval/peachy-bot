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
            category: 'friendship',
            aliases: ['pn'],
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

    run(client, ctx, args, color, emoji, language) {
        const relationshipMessages = language.locales.get(language.defaultLocale)?.profileMessages?.relationshipMessages;
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0];
        const userToModify = ctx.isInteraction ? ctx.interaction.options.getUser('user')?.id : ctx.message.mentions.users.first()?.id || args[1];

        if (!userToModify) {
            return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.userNotMentioned, color);
        }

        Users.findOne({ userId: ctx.author.id })
            .then(userData => {
                if (!userData) {
                    return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.notRegistered, color);
                }

                // Ensure relationship exists
                if (!userData.relationship) {
                    userData.relationship = {};  // Initialize the relationship object if it's undefined
                }

                Users.findOne({ userId: userToModify })
                    .then(targetUserData => {
                        if (!targetUserData) {
                            return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.targetNotRegistered, color);
                        }

                        if (action === 'add') {
                            if (userData.relationship.partner?.id) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.partner.error.alreadyExists, color);
                            }
                            userData.relationship.partner = {
                                id: userToModify,
                                name: targetUserData.username,
                                xp: 0,
                                level: 1
                            };
                        } else if (action === 'remove') {
                            if (userData.relationship.partner?.id !== userToModify) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.partner.error.notFound, color);
                            }
                            userData.relationship.partner = { id: null, name: null, xp: 0, level: 1 };
                        }

                        userData.save()
                            .then(() => client.utils.sendSuccessMessage(client, ctx, `${relationshipMessages.success[action]} <@${userToModify}> as your partner.`, color))
                            .catch(err => console.error(err));
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    }
};
