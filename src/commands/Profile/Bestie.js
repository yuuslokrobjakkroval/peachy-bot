const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class AddBestie extends Command {
    constructor(client) {
        super(client, {
            name: 'bestie',
            description: {
                content: 'Add or remove a best friend.',
                examples: ['bestie add @user', 'bestie remove @user'],
                usage: 'bestie <add/remove> <user>',
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
                    name: 'user',
                    description: 'The user you want to add or remove as a best friend.',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const author = ctx.author;
        const userToModify = ctx.isInteraction ? ctx.interaction.options.getUser('user').id : ctx.message.mentions.users.first()?.id || args[1];
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0];

        if (!userToModify) {
            return await client.utils.sendErrorMessage(client, ctx, 'Please mention a user to add or remove as a best friend.');
        }

        const userData = await Users.findOne({ userId: author.id });
        if (!userData) {
            return await client.utils.sendErrorMessage(client, ctx, 'You are not registered in the database.');
        }

        const targetUserData = await Users.findOne({ userId: userToModify });
        if (!targetUserData) {
            return await client.utils.sendErrorMessage(client, ctx, 'The user you are trying to modify is not registered.');
        }

        if (action === 'add') {
            if (userData.bestie.length >= 5) {
                return await client.utils.sendErrorMessage(client, ctx, 'You can only have up to 5 best friends.');
            }

            if (!userData.bestie.some(bestie => bestie.bestieWith === userToModify)) {
                userData.bestie.push({ bestieWith: userToModify, dateOfBestie: new Date() });
                await userData.save();
                return await client.utils.sendSuccessMessage(client, ctx, `Successfully added <@${userToModify}> as a best friend.`);
            } else {
                return await client.utils.sendErrorMessage(client, ctx, 'This user is already your best friend.');
            }
        } else if (action === 'remove') {
            if (userData.bestie.some(bestie => bestie.bestieWith === userToModify)) {
                userData.bestie = userData.bestie.filter(bestie => bestie.bestieWith !== userToModify);
                await userData.save();
                return await client.utils.sendSuccessMessage(client, ctx, `Successfully removed <@${userToModify}> from your best friends.`);
            } else {
                return await client.utils.sendErrorMessage(client, ctx, 'This user is not your best friend.');
            }
        } else {
            return await client.utils.sendErrorMessage(client, ctx, 'Invalid action. Use `add` or `remove`.');
        }
    }
};
