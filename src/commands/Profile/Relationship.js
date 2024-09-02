const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class ManageRelationship extends Command {
    constructor(client) {
        super(client, {
            name: 'relationship',
            description: {
                content: 'Manage your social relationships: partner, bros, sisters, besties, confidants.',
                examples: [
                    'relationship add partner @user - Adds the mentioned user as your partner.',
                    'relationship remove partner @user - Removes the mentioned user from your partner slot.',
                    'relationship add bro @user - Adds the mentioned user as one of your bros (up to 4).',
                    'relationship remove bro @user - Removes the mentioned user from your bros.',
                    'relationship add sister @user - Adds the mentioned user as one of your sisters (up to 4).',
                    'relationship remove sister @user - Removes the mentioned user from your sisters.',
                    'relationship add bestie @user - Adds the mentioned user as one of your besties (up to 4).',
                    'relationship remove bestie @user - Removes the mentioned user from your besties.',
                    'relationship add confidant @user - Adds the mentioned user as one of your confidants (up to 4).',
                    'relationship remove confidant @user - Removes the mentioned user from your confidants.',
                    'relationship help - Displays examples and usage information for the command.'
                ],
                usage: 'relationship <add/remove/help> <relationship type> <user>',
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
                    description: 'Action to perform: add, remove, or help.',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'Add', value: 'add' },
                        { name: 'Remove', value: 'remove' },
                        { name: 'Help', value: 'help' }
                    ]
                },
                {
                    name: 'relationship',
                    description: 'Type of relationship: partner, bro, sister, bestie, confidant.',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Partner', value: 'partner' },
                        { name: 'Bro', value: 'bro' },
                        { name: 'Sister', value: 'sister' },
                        { name: 'Bestie', value: 'bestie' },
                        { name: 'Confidant', value: 'confidant' }
                    ]
                },
                {
                    name: 'user',
                    description: 'The user you want to add or remove.',
                    type: 6,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0];

        if (action === 'help') {
            return this.showHelp(client, ctx);
        }

        const author = ctx.author;
        const userToModify = ctx.isInteraction ? ctx.interaction.options.getUser('user')?.id : ctx.message.mentions.users.first()?.id || args[2];
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
                    if (userData.relationship.partner.id) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You already have a partner.');
                    }
                    userData.relationship.partner = {
                        id: userToModify,
                        name: targetUserData.username,
                        xp: 0,
                        level: 1
                    };
                } else if (action === 'remove') {
                    if (userData.relationship.partner.id !== userToModify) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your partner.');
                    }
                    userData.relationship.partner = { id: null, name: null, xp: 0, level: 1 };
                }
                break;

            case 'bro':
                if (action === 'add') {
                    if (userData.relationship.brothers.length >= 4) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 4 bros.');
                    }
                    if (userData.relationship.brothers.some(bro => bro.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is already your bro.');
                    }
                    userData.relationship.brothers.push({
                        id: userToModify,
                        name: targetUserData.username,
                        xp: 0,
                        level: 1
                    });
                } else if (action === 'remove') {
                    if (!userData.relationship.brothers.some(bro => bro.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your bro.');
                    }
                    userData.relationship.brothers = userData.relationship.brothers.filter(bro => bro.id !== userToModify);
                }
                break;

            case 'sister':
                if (action === 'add') {
                    if (userData.relationship.sisters.length >= 4) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 4 sisters.');
                    }
                    if (userData.relationship.sisters.some(sister => sister.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is already your sister.');
                    }
                    userData.relationship.sisters.push({
                        id: userToModify,
                        name: targetUserData.username,
                        xp: 0,
                        level: 1
                    });
                } else if (action === 'remove') {
                    if (!userData.relationship.sisters.some(sister => sister.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your sister.');
                    }
                    userData.relationship.sisters = userData.relationship.sisters.filter(sister => sister.id !== userToModify);
                }
                break;

            case 'bestie':
                if (action === 'add') {
                    if (userData.relationship.besties.length >= 4) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 4 besties.');
                    }
                    if (userData.relationship.besties.some(bestie => bestie.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is already your bestie.');
                    }
                    userData.relationship.besties.push({
                        id: userToModify,
                        name: targetUserData.username,
                        xp: 0,
                        level: 1
                    });
                } else if (action === 'remove') {
                    if (!userData.relationship.besties.some(bestie => bestie.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your bestie.');
                    }
                    userData.relationship.besties = userData.relationship.besties.filter(bestie => bestie.id !== userToModify);
                }
                break;

            case 'confidant':
                if (action === 'add') {
                    if (userData.relationship.confidants.length >= 4) {
                        return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 4 confidants.');
                    }
                    if (userData.relationship.confidants.some(confidant => confidant.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is already your confidant.');
                    }
                    userData.relationship.confidants.push({
                        id: userToModify,
                        name: targetUserData.username,
                        xp: 0,
                        level: 1
                    });
                } else if (action === 'remove') {
                    if (!userData.relationship.confidants.some(confidant => confidant.id === userToModify)) {
                        return await client.utils.sendErrorMessage(client, ctx, 'This user is not your confidant.');
                    }
                    userData.relationship.confidants = userData.relationship.confidants.filter(confidant => confidant.id !== userToModify);
                }
                break;

            default:
                return await client.utils.sendErrorMessage(client, ctx, 'Invalid relationship type.');
        }

        await userData.save();
        await client.utils.sendSuccessMessage(client, ctx, `Successfully ${action === 'add' ? 'added' : 'removed'} <@${userToModify}> as your ${relationship}.`);
    }

    showHelp(client, ctx) {
        const embed = client.embed()
            .setTitle('Relationship Command Help')
            .setColor(client.color.main)
            .setDescription('Manage your social relationships: partner, bros, sisters, besties, confidants.')
            .addFields([
                { name: '**Partner**', value: '`relationship add partner @user`\n`relationship remove partner @user`', inline: false },
                { name: '**Brother**', value: '`relationship add bro @user`\n`relationship remove bro @user`', inline: false },
                { name: '**Sister**', value: '`relationship add sister @user`\n`relationship remove sister @user`', inline: false },
                { name: '**Bestie**', value: '`relationship add bestie @user`\n`relationship remove bestie @user`', inline: false },
                { name: '**Confidant**', value: '`relationship add confidant @user`\n`relationship remove confidant @user`', inline: false },
            ])
            .setFooter({ text: 'for bro sister bestie and confidant can add or remove (up to 4).' });

        return ctx.sendMessage({ embeds: [embed] });
    }
};
