const { GatewayIntentBits } = require('discord.js');
const GiveawaySchema = require('./schemas/giveaway');
const config = require('./config.js');
const PeachyClient = require('./structures/Client.js');
const { GuildMembers, MessageContent, GuildVoiceStates, GuildMessages, Guilds, GuildMessageTyping, GuildMessageReactions } = GatewayIntentBits;

const clientOptions = {
  intents: [Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers, GuildMessageTyping, GuildMessageReactions],
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: false,
  },
};

const client = new PeachyClient(clientOptions);

setInterval(async () => {
  const now = Date.now();
  const giveaways = await GiveawaySchema.find({ endTime: { $lte: now }, ended: false });
  for (const giveaway of giveaways) {
      const giveawayMessage = await client.channels.cache.get(giveaway.channelId);
      if (giveawayMessage) {
        await client.utils.endGiveaway(client, client.color, client.emoji, giveawayMessage, giveaway.autopay);

        giveaway.ended = true;
        await giveaway.save();
      } else {
        return;
      }
  }
}, 6000);

client.start(config.token);
