const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require('axios');
const Provinces = require('../../assets/json/provinces.json'); // Your province JSON data
const { emojiButton } = require('../../functions/function');

const API_KEY = 'd3c2eb6da3eeb3cdceb520c68679fc00'; // Your Weatherstack API key
const BASE_URL = 'http://api.weatherstack.com/current';

const weatherEmojis = {
    "clear": "☀️",
    "sunny": "🌞",
    "partly_cloudy": "⛅",
    "cloudy": "☁️",
    "overcast": "🌥️",
    "foggy": "🌫️",
    "misty": "🌁",
    "rain": "🌧️",
    "light_rain": "🌦️",
    "heavy_rain": "🌧️",
    "thundery_showers": "⛈️",
    "snow": "❄️",
    "light_snow": "🌨️",
    "heavy_snow": "❄️",
    "sleet": "🌧️❄️",
    "hail": "🌨️",
    "windy": "💨",
    "stormy": "🌩️",
    "torrential_rain": "🌧️",
    "blizzard": "🌨️❄️💨",
    "thunderstorm": "⛈️",
    "hazy": "🌫️",
    "dusty": "🌪️",
    "humid": "💦",
    "drizzle": "🌦️",
    "patchy_rain": "🌧️",
    "patchy_snow": "🌨️",
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
        const selectedProvinces = Provinces;
        const weather = language.locales.get(language.defaultLocale)?.funMessage?.weather;
        const pages = [];
        const itemsPerPage = 5; // Adjust the number of provinces per page
        const totalPages = Math.ceil(selectedProvinces.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${weather.title} ${emoji.mainRight}`)
                .setImage('https://i.imgur.com/5CZWtLN.png')
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            pages.push({ embed });
        }

        await paginateWeather(client, ctx, pages, color, weather);
    }
};

async function paginateWeather(client, ctx, pages, color, language) {
    let page = 0;
    let selectedItemIndex = null;
    let selectedProvinceName = language.selectProvince;

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
            .addOptions(itemOptions.length ? itemOptions : [{ label: language.noProvinces, value: 'none' }]);

        const row1 = new ActionRowBuilder().addComponents(itemSelect);
        const row2 = new ActionRowBuilder().addComponents(homeButton, prevButton, nextButton);

        return { components: [row1, row2], embeds: [pages[page]?.embed] };
    };

    const displayWeatherDetails = async (index) => {
        const province = Provinces[index];
        if (!province) {
            return client.embed()
                .setDescription(language.provinceNotFound) // Use localization for error message
                .setColor(color.red);
        }

        const weather = await fetchWeather(province.englishName);
        const weatherEmoji = getWeatherEmoji(weather?.description);

        if (!weather) {
            return client.embed()
                .setColor(color.red)
                .setTitle(`${province.englishName === 'Phnom Penh' ? `អាកាសធាតុសម្រាប់ក្រុង ${province.name}` : `អាកាសធាតុសម្រាប់ខេត្ត ${province.name}`}`)
                .setDescription(language.dataFetchFailed) // Use localization for error message
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });
        }

        return client.embed()
            .setColor(color.main)
            .setTitle(`${province.englishName === 'Phnom Penh' ? `អាកាសធាតុសម្រាប់ក្រុង ${province.name}` : `អាកាសធាតុសម្រាប់ខេត្ត ${province.name}`}`)
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
                selectedProvinceName = language.selectProvince;
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
                selectedItemIndex = int.values[0]; // Get the selected province ID
                const embed = await displayWeatherDetails(selectedItemIndex);
                await int.update({ embeds: [embed], components: getButtonRow().components });
            }
        }
    });

    collector.on('end', () => {
        msg.edit({ components: [] }); // Disable buttons after timeout
    });
}
