const { GatewayIntentBits } = require('discord.js');
const GiveawaySchema = require('./schemas/giveaway');
const config = require('./config.js');
const PeachyClient = require('./structures/Client.js');
const { GuildMembers, MessageContent, GuildVoiceStates, GuildMessages, Guilds, GuildMessageTyping, GuildMessageReactions } = GatewayIntentBits;
const ONE_DAY_MS = 86400000; // 24 hours

function getInitialDelay() {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setUTCHours(0, 0, 0, 0); // Set for midnight UTC or desired time
    if (nextRun <= now) nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    return nextRun - now;
}

const clientOptions = {
    intents: [Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers, GuildMessageTyping, GuildMessageReactions],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
    },
};

const client = new PeachyClient(clientOptions);

setInterval(() => {
    const now = Date.now();
    GiveawaySchema.find({ endTime: { $lte: now }, ended: false })
        .then((giveaways) => {
            giveaways.forEach((giveaway) => {
                if (giveaway) {
                    client.channels.cache.get(giveaway.channelId)?.messages.fetch(giveaway.messageId)
                        .then((giveawayMessage) => {
                            if (giveawayMessage) {
                                client.utils.endGiveaway(client, client.color, client.emoji, giveawayMessage, giveaway.autopay)
                                    .then(() => {
                                        giveaway.ended = true;
                                        return giveaway.save();
                                    })
                                    .catch((err) => console.error('Error ending giveaway:', err));
                            }
                        })
                        .catch((err) => {
                            if (err.code === 10008) {
                                // Handle the case where the message is not found (Unknown Message)
                                console.warn(`Message with ID ${giveaway.messageId} was not found.`);
                                giveaway.ended = true;
                                giveaway.save().catch(console.error);
                            } else {
                                console.error('Error fetching message:', err);
                            }
                        });
                }
            });
        })
        .catch((err) => console.error('Error finding giveaways:', err));
}, 10000);

setTimeout(() => {
    client.utils.checkBirthdays(client)
        .then(() => console.log('Birthday check completed.'))
        .catch((err) => console.error('Error in checkBirthdays function:', err));

    setInterval(() => {
        client.utils.checkBirthdays(client)
            .then(() => console.log('Birthday check completed.'))
            .catch((err) => console.error('Error in checkBirthdays function:', err));
    }, ONE_DAY_MS);
}, getInitialDelay());

client.start(config.token);
