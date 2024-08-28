const { Command } = require("../../structures");
const Race = require("../../schemas/race");

// Replace these with your actual GIF emoji URLs or IDs
const emojiTurtle = '<a:TURTLE:1278349191822966905>'; // Replace with your turtle GIF emoji ID
const emojiRabbit = '<a:RABBIT:1278349205219442802>'; // Replace with your rabbit GIF emoji ID

class RaceGame extends Command {
    constructor(client) {
        super(client, {
            name: "race",
            description: {
                content: "Start a race between the rabbit and the turtle!",
                examples: ["race"],
                usage: "race",
            },
            category: "game",
            aliases: ["race"],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx) {
        try {
            const userId = ctx.author.id;
            let race = await Race.findOne({ userId });

            if (race && race.isActive) {
                return ctx.sendMessage('You already have a race in progress!');
            }

            if (!race) {
                race = new Race({
                    userId,
                    rabbit: 0,
                    turtle: 0,
                    isActive: true,
                });
            } else {
                race.isActive = true;
                race.rabbit = 0;
                race.turtle = 0;
            }

            await race.save();

            const finishLine = 100;
            let resultMessage = 'The race has started!\n';
            let raceMessage = await ctx.sendMessage(resultMessage);

            while (race.rabbit < finishLine && race.turtle < finishLine) {
                const rabbitMove = Math.random() < 0.8 ? Math.floor(Math.random() * 4) + 1 : 0;
                const turtleMove = Math.floor(Math.random() * 10) + 1;

                race.rabbit += rabbitMove;
                race.turtle += turtleMove;

                await race.save();

                resultMessage = `Rabbit moved ${rabbitMove} units. Total: ${race.rabbit} units.\n`;
                resultMessage += `Turtle moved ${turtleMove} units. Total: ${race.turtle} units.\n\n`;
                resultMessage += `Current Progress:\n`;
                resultMessage += `Rabbit: ${emojiRabbit.repeat(Math.floor(race.rabbit / 10))}\n`; // Adjust scaling to fit the finish line
                resultMessage += `Turtle: ${emojiTurtle.repeat(Math.floor(race.turtle / 10))}\n`; // Adjust scaling to fit the finish line

                await raceMessage.edit(resultMessage);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before the next update
            }

            let winner = '';
            if (race.rabbit >= finishLine) {
                winner = "Rabbit wins!";
            } else if (race.turtle >= finishLine) {
                winner = "Turtle wins!";
            }

            race.isActive = false;
            await race.save();

            resultMessage += `\n🏁 ${winner}`;
            await raceMessage.edit(resultMessage);
        } catch (error) {
            console.error("An error occurred while running the race command:", error);
            await ctx.sendMessage('An error occurred while running the race. Please try again later.');
        }
    }
}

module.exports = RaceGame;
