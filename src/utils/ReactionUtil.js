module.exports = function parseEmoji(input, guild) {
    if (!input) return null;

    if (!input.includes('<') && !/^\d+$/.test(input)) {
        return { id: null, name: input, animated: false };
    }

    if (!/^\d+$/.test(input)) {
        const emoji = guild.emojis.cache.get(input);
        if (!emoji) return null;
        return emoji;
    }

    const match = input.match(/<a?:\w+:(\d+)>/);
    if (!match) return null;

    const emoji = guild.emojis.cache.get(match[3]);
    if (!emoji) return null;
    return emoji;
};
