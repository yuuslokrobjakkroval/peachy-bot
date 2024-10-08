const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require('axios');
const Provinces = require('../../assets/json/provinces.json'); // Your province JSON data
const { emojiButton } = require('../../functions/function');

const API_KEY = 'd3c2eb6da3eeb3cdceb520c68679fc00'; // Your Weatherstack API key
const BASE_URL = 'http://api.weatherstack.com/current';

const weatherEmojis = {
    "clear": "☀️",           // Clear sky
    "sunny": "🌞",            // Sunny
    "partly_cloudy": "⛅",    // Partly cloudy
    "cloudy": "☁️",          // Cloudy
    "overcast": "🌥️",        // Overcast
    "foggy": "🌫️",           // Foggy
    "misty": "🌁",            // Misty
    "rain": "🌧️",            // Rain
    "light_rain": "🌦️",      // Light rain
    "heavy_rain": "🌧️",      // Heavy rain
    "thundery_showers": "⛈️",// Thundery showers
    "snow": "❄️",            // Snow
    "light_snow": "🌨️",      // Light snow
    "heavy_snow": "❄️",      // Heavy snow
    "sleet": "🌧️❄️",        // Sleet
    "hail": "🌨️",            // Hail
    "windy": "💨",           // Windy
    "stormy": "🌩️",         // Stormy
    "torrential_rain": "🌧️", // Torrential rain
    "blizzard": "🌨️❄️💨",   // Blizzard
    "thunderstorm": "⛈️",    // Thunderstorm
    "hazy": "🌫️",           // Hazy
    "dusty": "🌪️",          // Dusty
    "humid": "💦",           // Humid
    "drizzle": "🌦️",        // Drizzle
    "patchy_rain": "🌧️",    // Patchy rain
    "patchy_snow": "🌨️",    // Patchy snow
};

// Get emoji based on weather description
const getWeatherEmoji = (description) => {
    const normalizedDescription = description.trim().toLowerCase().replace(/ /g, '_');
    return weatherEmojis[normalizedDescription] || "🌍"; // Default emoji if not found
};

module.exports = class Weather extends Command {
    constructor(client) {
        super(client, {
            name: 'weather',
            description: {
                content: 'View weather information for provinces/cities in Cambodia.',
                examples: ['weather'],
                usage: 'weather',
            },
            cooldown: 5,
            category: 'info',
            aliases: ['wtr', 'temp'],
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const selectedProvinces = Provinces; // All provinces

        const pages = [];
        const itemsPerPage = 5; // Adjust the number of provinces per page
        const totalPages = Math.ceil(selectedProvinces.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} 𝐖𝐄𝐀𝐓𝐇𝐄𝐑 𝐎𝐅 𝐏𝐑𝐎𝐕𝐈𝐍𝐂𝐄𝐒 / 𝐂𝐈𝐓𝐈𝐄𝐒 ${emoji.mainRight}`)
                .setImage('https://i.imgur.com/5CZWtLN.png')
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            pages.push({ embed });
        }

        await paginateWeather(client, ctx, pages);
    }
};

async function paginateWeather(client, ctx, pages, color) {
    let page = 0;
    let selectedItemIndex = null;
    let selectedProvinceName = 'Select a province';

    const getButtonRow = () => {
        const homeButton = emojiButton('home', '🏠', 2); // Home button
        const prevButton = emojiButton('prev_item', '⬅️', 2);
        const nextButton = emojiButton('next_item', '➡️', 2);

        const itemOptions = Provinces.map(item => ({
            label: item.name,
            value: item.id,
        })).filter(option => option.label && option.value); // Ensure valid options

        const itemSelect = new StringSelectMenuBuilder()
            .setCustomId('item_select')
            .setPlaceholder(selectedProvinceName)
            .addOptions(itemOptions.length ? itemOptions : [{ label: 'No provinces available', value: 'none' }]);

        const row1 = new ActionRowBuilder().addComponents(itemSelect);
        const row2 = new ActionRowBuilder().addComponents(homeButton, prevButton, nextButton);

        return { components: [row1, row2], embeds: [pages[page]?.embed] };
    };

    const displayWeatherDetails = async (index) => {
        const province = Provinces[index];
        if (!province) {
            console.error('Province not found at index:', index);
            return client.embed()
                .setDescription('Province not found.')
                .setColor(color.red);
        }

        const weather = await fetchWeather(province.englishName);
        const weatherEmoji = getWeatherEmoji(weather.description);

        if (!weather) {
            return client.embed()
                .setColor(color.red)
                .setTitle(`${province.englishName === 'Phnom Penh' ? `អាកាសធាតុសម្រាប់ក្រុង${province.name}`: `អាកាសធាតុសម្រាប់ខេត្ត${province.name}`}`)
                .setDescription('Failed to retrieve weather data. Please check the API key or try again later.')
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });
        }

        return client.embed()
            .setColor(color.main)
            .setTitle(`${province.englishName === 'Phnom Penh' ? `អាកាសធាតុសម្រាប់ក្រុង${province.name}`: `អាកាសធាតុសម្រាប់ខេត្ត${province.name}`}`)
            .setThumbnail(client.utils.emojiToImage(weatherEmoji))
            .setDescription(`**អាកាសធាតុ :** ${weather.description} ${weatherEmoji}\n**សីតុណ្ហភាព :** ${weather.temp}°C\n**សំណើម :** ${weather.humidity}%`)
            .setImage(province.image)
            .setFooter({
                text: `Request By ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });
    };

    const fetchWeather = async (provinceName) => {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    query: provinceName + ',KH',
                    units: 'm', // Metric units (Celsius)
                },
            });
            const data = response.data;

            if (!data || !data.current) {
                console.error('Invalid data from Weatherstack:', data);
                return null;
            }

            return {
                description: data.current.weather_descriptions[0],
                temp: data.current.temperature,
                humidity: data.current.humidity,
            };
        } catch (error) {
            console.error(`Failed to fetch weather for ${provinceName}:`, error.response ? error.response.data : error.message);
            return null;
        }
    };

    const msg = ctx.isInteraction
        ? await ctx.interaction.reply({ ...getButtonRow(), fetchReply: true })
        : await ctx.channel.send({ ...getButtonRow(), fetchReply: true });

    if (!msg) {
        console.error('Message could not be sent.');
        return;
    }

    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === ctx.author.id,
        time: 300000, // 5 minutes
    });

    collector.on('collect', async int => {
        if (ctx.author.id === int.user.id) {
            if (int.customId === 'home') {
                selectedItemIndex = null;
                selectedProvinceName = 'Select a province';
                page = 0;
                await int.update({ ...getButtonRow(), embeds: [pages[page]?.embed] });
            } else if (int.customId === 'prev_item') {
                selectedItemIndex = (selectedItemIndex === null ? Provinces.length : selectedItemIndex) - 1;
                if (selectedItemIndex < 0) selectedItemIndex = Provinces.length - 1;
                selectedProvinceName = Provinces[selectedItemIndex].name;
                const embed = await displayWeatherDetails(selectedItemIndex);
                await int.update({ embeds: [embed], components: getButtonRow().components });
            } else if (int.customId === 'next_item') {
                selectedItemIndex = (selectedItemIndex === null ? -1 : selectedItemIndex) + 1;
                if (selectedItemIndex >= Provinces.length) selectedItemIndex = 0;
                selectedProvinceName = Provinces[selectedItemIndex].name;
                const embed = await displayWeatherDetails(selectedItemIndex);
                await int.update({ embeds: [embed], components: getButtonRow().components });
            } else if (int.customId === 'item_select') {
                selectedItemIndex = Provinces.findIndex(p => p.id === int.values[0]);
                if (selectedItemIndex !== -1) {
                    selectedProvinceName = Provinces[selectedItemIndex].name;
                    const embed = await displayWeatherDetails(selectedItemIndex);
                    await int.update({ embeds: [embed], components: getButtonRow().components });
                } else {
                    await int.update({ embeds: [client.embed().setDescription('Province not found.').setColor(color.red)], components: getButtonRow().components });
                }
            }
        } else {
            await int.reply({ content: 'You cannot interact with this menu.', ephemeral: true });
        }
    });

    collector.on('end', () => {
        msg.edit({ components: [] });
    });
}
