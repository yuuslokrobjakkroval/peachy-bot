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
        const puzzleMessages = language.locales.get(language.defaultLocale)?.gameMessages?.puzzleMessages;
        const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        const maxGuesses = 3; // Maximum number of guesses
        let guesses = 0; // Track the number of guesses

        // Send the initial puzzle embed
        let embed = this.createPuzzleEmbed(client, color, emoji, puzzle, puzzleMessages);
        await ctx.sendMessage({ embeds: [embed] });

        // Loop to allow multiple guesses
        while (guesses < maxGuesses) {
            const filter = response => response.author.id === ctx.author.id;
            const collected = await ctx.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] }).catch(() => { });

            if (!collected) {
                embed = this.createTimeoutEmbed(client, color, emoji, puzzle.answer, puzzleMessages);
                return ctx.sendMessage({ embeds: [embed] });
            }

            const userAnswer = collected.first().content.toLowerCase();
            guesses++; // Increment the guess count

            if (userAnswer === puzzle.answer.toLowerCase()) {
                embed = this.createCorrectEmbed(client, color, emoji, puzzleMessages);
                await ctx.sendMessage({ embeds: [embed] });
                return; // End the command after a correct guess
            } else {
                if (guesses < maxGuesses) {
                    embed = this.createWrongEmbed(client, color, emoji, maxGuesses - guesses, puzzleMessages);
                    await ctx.sendMessage({ embeds: [embed] });
                }
            }
        }

        // If the user runs out of guesses
        embed = this.createGameOverEmbed(client, color, emoji, puzzle.answer, puzzleMessages);
        await ctx.sendMessage({ embeds: [embed] });
    }

    createPuzzleEmbed(client, color, emoji, puzzle, puzzleMessages) {
        return client.embed()
            .setColor(color.main)
            .setTitle(puzzleMessages.title)
            .setDescription(`${puzzleMessages.prompt}\n${puzzle.emoji}`);
    }

    createCorrectEmbed(client, color, emoji, puzzleMessages) {
        return client.embed()
            .setColor(color.green)
            .setTitle(`${puzzleMessages.correct.title} ${emoji.congratulation}`)
            .setDescription(puzzleMessages.correct.description);
    }

    createWrongEmbed(client, color, emoji, guessesLeft, puzzleMessages) {
        return client.embed()
            .setColor(color.red)
            .setTitle(puzzleMessages.wrong.title)
            .setDescription(`${puzzleMessages.wrong.description} ${guessesLeft} ${puzzleMessages.wrong.guessesLeft}`);
    }

    createTimeoutEmbed(client, color, emoji, correctAnswer, puzzleMessages) {
        return client.embed()
            .setColor(color.orange)
            .setTitle(puzzleMessages.timeout.title)
            .setDescription(`${puzzleMessages.timeout.description} **${correctAnswer}**.`);
    }

    createGameOverEmbed(client, color, emoji, correctAnswer, puzzleMessages) {
        return client.embed()
            .setColor(color.red)
            .setTitle(puzzleMessages.gameOver.title)
            .setDescription(`${puzzleMessages.gameOver.description} **${correctAnswer}**.`);
    }
};
