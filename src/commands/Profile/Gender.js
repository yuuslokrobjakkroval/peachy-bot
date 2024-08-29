const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/User.js");

module.exports = class Gender extends Command {
    constructor(client) {
        super(client, {
            name: 'gender',
            description: {
                content: 'Set or update your gender in your profile.',
                examples: ['gender male', 'gender female'],
                usage: 'gender <male/female>',
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
                    name: 'gender',
                    description: 'The gender to set for your profile.',
                    type: 3, // STRING type
                    required: false,
                    choices: [
                        { name: 'Male', value: 'male' },
                        { name: 'Female', value: 'female' }
                    ],
                },
                {
                    name: 'help',
                    description: 'Show help information for the gender command.',
                    type: 1, // SUB_COMMAND type
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const author = ctx.author;

        // Check for help subcommand
        if (ctx.isInteraction && ctx.interaction.options.getSubcommand() === 'help') {
            const helpEmbed = client
                .embed()
                .setColor(client.color.main)
                .setTitle('Gender Command Help')
                .setDescription('Here is how you can use the gender command:')
                .addFields([
                    { name: 'Set Gender', value: '```gender male``` or ```gender female```' },
                    { name: 'Help', value: '```gender help```' },
                ]);

            return await ctx.sendMessage({ embeds: [helpEmbed] });
        }

        const gender = ctx.isInteraction ? ctx.interaction.options.getString('gender') : args[0]?.toLowerCase();

        // Validate gender input
        if (!['male', 'female'].includes(gender)) {
            return await client.utils.sendErrorMessage(client, ctx, 'Invalid gender. Please use `male` or `female`.');
        }

        // Fetch or create user data
        let userData = await Users.findOne({ userId: author.id });
        if (!userData) {
            userData = new Users({ userId: author.id });
        }

        // Update gender
        userData.gender = gender;
        await userData.save();

        // Send confirmation message
        return await client.utils.sendSuccessMessage(client, ctx, `Your gender has been updated to **${gender.charAt(0).toUpperCase() + gender.slice(1)}**.`);
    }
};
