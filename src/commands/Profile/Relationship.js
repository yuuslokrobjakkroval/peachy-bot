const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class ManageRelationship extends Command {
    constructor(client) {
        super(client, {
            name: 'relationship',
            description: {
                content: 'Manage your social relationships: partner, bros, besties, confidants.',
                examples: ['relationship add partner @user', 'relationship remove bestie @user'],
                usage: 'relationship <add/remove> <relationship type> <user>',
            },
            category: 'profile',
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
                        { name: 'Remove', value: 'remove' }
                    ]
                },
                {
                    name: 'relationship',
                    description: 'Type of relationship: partner, bro, bestie, confidant.',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'Partner', value: 'partner' },
                        { name: 'Bro', value: 'bro' },
                        { name: 'Bestie', value: 'bestie' },
                        { name: 'Confidant', value: 'confidant' }
                    ]
                },
                {
                    name: 'user',
                    description: 'The user you want to add or remove.',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const author = ctx.author;
        const userToModify = ctx.isInteraction ? ctx.interaction.options.getUser('user').id : ctx.message.mentions.users.first()?.id || args[2];
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0];
        const relationship = ctx.isInteraction ? ctx.interaction.options.getString('relationship') : args[1];

        if (!userToModify) {
            return await client.utils.sendErrorMessage(client, ctx, 'Please mention a user to manage your relationship.');
        }

        const userData = await Users.findOne({ userId: author.id });
        if (!userData) {
            return await client.utils.sendErrorMessage(client, ctx, 'You are not registered in the database.');
        }

        const targetUserData = await Users.findOne({ userId: userToModify });
        if (!targetUserData) {
            return await client.utils.sendErrorMessage(client, ctx, 'The user you are trying to modify is not registered.');
        }

        switch (relationship) {
            case 'partner':
                if (action === 'add') {
                    if (userData.partner) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You already have a partner.');
                    }
                    userData.partner = userToModify;
                } else if (action === 'remove') {
                    if (userData.partner !== userToModify) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your partner.');
                    }
                    userData.partner = null;
                }
                break;

            case 'bro':
                if (action === 'add') {
                    if (userData.bros.length >= 4) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 4 bros.');
                    }
                    if (userData.bros.some(bro => bro.userId === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is already your bro.');
                    }
                    userData.bros.push({ userId: userToModify, dateAdded: new Date() });
                } else if (action === 'remove') {
                    if (!userData.bros.some(bro => bro.userId === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your bro.');
                    }
                    userData.bros = userData.bros.filter(bro => bro.userId !== userToModify);
                }
                break;

            case 'bestie':
                if (action === 'add') {
                    if (userData.besties.length >= 4) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 4 besties.');
                    }
                    if (userData.besties.some(bestie => bestie.userId === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is already your bestie.');
                    }
                    userData.besties.push({ userId: userToModify, dateAdded: new Date() });
                } else if (action === 'remove') {
                    if (!userData.besties.some(bestie => bestie.userId === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your bestie.');
                    }
                    userData.besties = userData.besties.filter(bestie => bestie.userId !== userToModify);
                }
                break;

            case 'confidant':
                if (action === 'add') {
                    if (userData.confidants.length >= 4) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 4 confidants.');
                    }
                    if (userData.confidants.some(confidant => confidant.userId === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is already your confidant.');
                    }
                    userData.confidants.push({ userId: userToModify, dateAdded: new Date() });
                } else if (action === 'remove') {
                    if (!userData.confidants.some(confidant => confidant.userId === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your confidant.');
                    }
                    userData.confidants = userData.confidants.filter(confidant => confidant.userId !== userToModify);
                }
                break;

            default:
                return await client.utils.sendErrorMessage(client, ctx, 'Invalid relationship type.');
        }

        await userData.save();
        await client.utils.sendSuccessMessage(client, ctx, `Successfully ${action === 'add' ? 'added' : 'removed'} <@${userToModify}> as your ${relationship}.`);
    }
};

