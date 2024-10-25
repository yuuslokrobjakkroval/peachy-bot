const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Brother extends Command {
    constructor(client) {
        super(client, {
            name: 'brother',
            description: {
                content: 'Manage your brother relationships.',
                examples: [
                    'brother add @user - Adds the mentioned user as one of your brothers.',
                    'brother remove @user - Removes the mentioned user from your brothers.'
                ],
                usage: 'brother <add/remove> <user>',
            },
            category: 'relationship',
            aliases: ['bros'],
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
                    description: 'The user you want to add or remove as a brother.',
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

                // Ensure relationship exists and initialize if necessary
                if (!userData.relationship) {
                    userData.relationship = { brothers: [] };
                }
                if (!userData.relationship.brothers) {
                    userData.relationship.brothers = [];
                }

                Users.findOne({ userId: userToModify })
                    .then(targetUserData => {
                        if (!targetUserData) {
                            return client.utils.sendErrorMessage(client, ctx, relationshipMessages.error.targetNotRegistered, color);
                        }

                        if (action === 'add') {
                            if (userData.relationship.brothers.length >= 4) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.bro.error.limitExceeded, color);
                            }
                            if (userData.relationship.brothers.some(bro => bro.id === userToModify)) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.bro.error.alreadyExists, color);
                            }
                            userData.relationship.brothers.push({ id: userToModify, name: targetUserData.username, xp: 0, level: 1 });
                        } else if (action === 'remove') {
                            if (!userData.relationship.brothers.some(bro => bro.id === userToModify)) {
                                return client.utils.sendErrorMessage(client, ctx, relationshipMessages.bro.error.notFound, color);
                            }
                            userData.relationship.brothers = userData.relationship.brothers.filter(bro => bro.id !== userToModify);
                        }

                        userData.save()
                            .then(() => client.utils.sendSuccessMessage(client, ctx, `${relationshipMessages.success[action]} <@${userToModify}> as your brother.`, color))
                            .catch(err => console.error(err));
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    }
};
