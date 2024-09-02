const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Divorce extends Command {
    constructor(client) {
        super(client, {
            name: 'divorce',
            description: {
                content: 'Ends the marriage with the currently married user.',
                examples: ['divorce'],
                usage: 'divorce',
            },
            category: 'profile',
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx) {
        const author = ctx.author;

        const authorData = await Users.findOne({ userId: author.id });

        if (!authorData.marriage.marriedTo) {
            return await client.utils.sendErrorMessage(client, ctx, 'You are not married!');
        }

        const targetId = authorData.marriage.marriedTo;
        const targetData = await Users.findOne({ userId: targetId });

        authorData.marriage.status = 'Single';
        authorData.marriage.marriedTo = null;
        authorData.marriage.item = null;
        authorData.marriage.dateOfRelationship = null;

        targetData.marriage.status = 'Single';
        targetData.marriage.marriedTo = null;
        targetData.marriage.item = null;
        targetData.marriage.dateOfRelationship = null;

        await Promise.all([
            authorData.save(),
            targetData.save(),
        ]);

        const embed = client
            .embed()
            .setColor(client.color.main)
            .setDescription(`You have divorced from <@${targetId}>. You are now single!`);

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
