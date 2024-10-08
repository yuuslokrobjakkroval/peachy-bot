const { Command } = require('../../structures/index.js');

module.exports = class Roll extends Command {
    constructor(client) {
        super(client, {
            name: 'roll',
            description: {
                content: 'Roll a dice and get a random result.',
                examples: ['roll d6', 'roll d20'],
                usage: 'roll <dice>',
            },
            category: 'games',
            aliases: ['dice'],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'dice',
                    description: 'Type of dice (e.g., d6, d20).',
                    type: 3, // String
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const dice = ctx.isInteraction ? ctx.interaction.options.getString('dice') : args[0];
        const match = /^d(\d+)$/.exec(dice);

        if (!match) {
            return client.utils.sendErrorMessage(client, ctx, 'Invalid dice type! Use something like d6, d20, etc.', color);
        }

        const sides = parseInt(match[1]);
        if (isNaN(sides) || sides <= 1) {
            return client.utils.sendErrorMessage(client, ctx, 'Invalid number of sides for a dice.', color);
        }

        const rollResult = Math.floor(Math.random() * sides) + 1;

        // Define win/lose criteria
        let threshold;
        if (sides === 6) {
            threshold = 4; // Example: Win if roll is 4 or higher for d6
        } else if (sides === 20) {
            threshold = 11; // Example: Win if roll is 11 or higher for d20
        } else {
            threshold = Math.ceil(sides / 2); // Default threshold: half the sides
        }

        // Determine win or lose
        const resultMessage = rollResult >= threshold
            ? `🎉 You rolled a **${dice}** and got **${rollResult}**! You win!`
            : `😞 You rolled a **${dice}** and got **${rollResult}**. You lose!`;

        await ctx.sendMessage(resultMessage);
    }
};
