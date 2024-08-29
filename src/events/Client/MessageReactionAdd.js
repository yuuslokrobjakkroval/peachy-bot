const { Event } = require('../../structures/index.js'); // Adjust the path as needed

module.exports = class MessageReactionAdd extends Event {
    constructor(client, file) {
        super(client, file, {
            name: 'messageReactionAdd',
        });
    }

    async run(reaction, user) {
        if (user.bot) return;
        // if (reaction.message.author.id === this.client.user.id) {
        //     const emoji = reaction.emoji.name;
        //     const hostId = reaction.message.interaction ? reaction.message.interaction.user.id : null;
        //     if (['A', 'B', 'C', 'D'].includes(emoji)) {
        //         if (hostId && user.id !== hostId) {
        //             await reaction.message.channel.send(`${user.username}, thank you for your reaction! But only the host can start the game.`);
        //         }
        //     }
        // }
    }
};
