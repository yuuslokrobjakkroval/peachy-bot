const { Command } = require('../../structures/index.js');

// List of emoji puzzles and answers
const puzzles = [
    { emoji: '🍕📞', answer: 'Pizza Delivery' },
    { emoji: '🌧️☂️', answer: 'Rainy Day' },
    { emoji: '🎬🍿', answer: 'Movie Night' },
    { emoji: '🐸☕', answer: 'Kermit sipping tea' },
];

module.exports = class EmojiPuzzle extends Command {
    constructor(client) {
        super(client, {
            name: 'emoji-puzzle',
            description: {
                content: 'Try to guess the phrase represented by emojis!',
                examples: ['emoji-puzzle'],
                usage: 'emoji-puzzle',
            },
            category: 'games',
            aliases: ['emojipuzzle', 'puzzle'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        const maxGuesses = 3; // Maximum number of guesses
        let guesses = 0; // Track the number of guesses

        // Send the initial puzzle embed
        let embed = this.createPuzzleEmbed(client, puzzle);
        await ctx.sendMessage({ embeds: [embed] });

        // Loop to allow multiple guesses
        while (guesses < maxGuesses) {
            const filter = response => response.author.id === ctx.author.id;
            const collected = await ctx.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] }).catch(() => { });

            if (!collected) {
                embed = this.createCorrectEmbed(client)
                return ctx.sendMessage({ embeds: [embed] });
            }

            const userAnswer = collected.first().content.toLowerCase();
            guesses++; // Increment the guess count

            if (userAnswer === puzzle.answer.toLowerCase()) {
                embed = this.createCorrectEmbed(client)
                await ctx.sendMessage({ embeds: [embed] });
                return; // End the command after a correct guess
            } else {
                if (guesses < maxGuesses) {
                    embed = this.createWrongEmbed(client, maxGuesses - guesses)
                    await ctx.sendMessage({ embeds: [embed] });
                }
            }
        }

        // If the user runs out of guesses
        embed = this.createGameOverEmbed(client, puzzle.answer)
        await ctx.sendMessage({ embeds: [embed] });
    }

    createPuzzleEmbed(client, puzzle) {
        return client.embed()
            .setColor(color.main)
            .setTitle('🧩 Emoji Puzzle')
            .setDescription(`What does this mean?\n${puzzle.emoji}`);
    }

    createCorrectEmbed(client) {
        return client.embed()
            .setColor(color.green)
            .setTitle('🎉 Correct!')
            .setDescription('Well done, you guessed the emoji puzzle correctly!');
    }

    createWrongEmbed(client, guessesLeft) {
        return client.embed()
            .setColor(color.red)
            .setTitle('❌ Wrong!')
            .setDescription(`You have ${guessesLeft} guesses left.`);
    }

    createTimeoutEmbed(client, correctAnswer) {
        return client.embed()
            .setColor(color.orange)
            .setTitle('⏳ Time is up!')
            .setDescription(`The correct answer was **${correctAnswer}**.`);
    }

    createGameOverEmbed(client, correctAnswer) {
        return client.embed()
            .setColor(color.red)
            .setTitle('❌ Game Over!')
            .setDescription(`You've used all your guesses! The correct answer was **${correctAnswer}**.`);
    }
};
