const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class RelationshipHelp extends Command {
    constructor(client) {
        super(client, {
            name: 'relationship',
            description: {
                content: 'Shows help for relationship commands or displays your relationships.',
                usage: 'relationship <help/all/type> [relationship type]',
            },
            category: 'relationship',
            aliases: ['rs'],
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
                    description: 'Choose an action: all, type, or help.',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'All', value: 'all' },
                        { name: 'Type', value: 'type' },
                        { name: 'Help', value: 'help' },
                    ]
                },
                {
                    name: 'relationship_type',
                    description: 'Type of relationship to view (required if action is "type").',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Partner', value: 'partner' },
                        { name: 'Brother', value: 'brother' },
                        { name: 'Sister', value: 'sister' },
                        { name: 'Bestie', value: 'bestie' },
                        { name: 'Confidant', value: 'confidant' }
                    ]
                }
            ],
        });
    }

    run(client, ctx, args, color, language) {
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0];
        const relationshipType = ctx.isInteraction ? ctx.interaction.options.getString('relationship_type') : args[1];

        if (action === 'help') {
            this.showHelp(client, ctx, color);
        } else if (action === 'all') {
            this.showAllRelationships(client, ctx, color, language);
        } else if (action === 'type') {
            if (!relationshipType) {
                return client.utils.sendErrorMessage(client, ctx, 'Please specify a relationship type.', color);
            }
            this.showRelationshipsByType(client, ctx, color, relationshipType, language);
        }
    }

    showHelp(client, ctx, color) {
        const embed = client.embed()
            .setTitle('Relationship Command Help')
            .setColor(color.main)
            .setDescription('Manage your social relationships.')
            .addFields([
                { name: '**Partner**', value: '`partner add @user`\n`partner remove @user`', inline: false },
                { name: '**Brother**', value: '`brother add @user`\n`brother remove @user`', inline: false },
                { name: '**Sister**', value: '`sister add @user`\n`sister remove @user`', inline: false },
                { name: '**Bestie**', value: '`bestie add @user`\n`bestie remove @user`', inline: false },
                { name: '**Confidant**', value: '`confidant add @user`\n`confidant remove @user`', inline: false },
            ])
            .setFooter({ text: 'You can add or remove up to 4 for bro, sister, bestie, and confidant.' });

        ctx.sendMessage({ embeds: [embed] });
    }

    showAllRelationships(client, ctx, color, language) {
        Users.findOne({ userId: ctx.author.id }).then(userData => {
            if (!userData) return client.utils.sendErrorMessage(client, ctx, 'You are not registered.', color);

            const relationshipEmbed = client.embed()
                .setTitle('Your Relationships')
                .setColor(color.main)
                .addFields([
                    { name: '**Partner**', value: userData.relationship.partner.name || 'None', inline: false },
                    { name: '**Brothers**', value: userData.relationship.brothers.map(bro => bro.name).join(', ') || 'None', inline: false },
                    { name: '**Sisters**', value: userData.relationship.sisters.map(sister => sister.name).join(', ') || 'None', inline: false },
                    { name: '**Besties**', value: userData.relationship.besties.map(bestie => bestie.name).join(', ') || 'None', inline: false },
                    { name: '**Confidants**', value: userData.relationship.confidants.map(confidant => confidant.name).join(', ') || 'None', inline: false },
                ]);

            ctx.sendMessage({ embeds: [relationshipEmbed] });
        }).catch(err => console.error(err));
    }

    showRelationshipsByType(client, ctx, color, relationshipType, language) {
        Users.findOne({ userId: ctx.author.id }).then(userData => {
            if (!userData) return client.utils.sendErrorMessage(client, ctx, 'You are not registered.', color);

            let relationshipList = [];
            let relationshipName = relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1);

            switch (relationshipType) {
                case 'partner':
                    relationshipList = userData.relationship.partner.name ? [userData.relationship.partner.name] : [];
                    break;
                case 'brother':
                    relationshipList = userData.relationship.brothers.map(bro => bro.name);
                    break;
                case 'sister':
                    relationshipList = userData.relationship.sisters.map(sister => sister.name);
                    break;
                case 'bestie':
                    relationshipList = userData.relationship.besties.map(bestie => bestie.name);
                    break;
                case 'confidant':
                    relationshipList = userData.relationship.confidants.map(confidant => confidant.name);
                    break;
                default:
                    return client.utils.sendErrorMessage(client, ctx, 'Invalid relationship type.', color);
            }

            const embed = client.embed()
                .setTitle(`${relationshipName} Relationships`)
                .setColor(color.main)
                .setDescription(relationshipList.length ? relationshipList.join(', ') : `No ${relationshipName.toLowerCase()}s found.`);

            ctx.sendMessage({ embeds: [embed] });
        }).catch(err => console.error(err));
    }
};