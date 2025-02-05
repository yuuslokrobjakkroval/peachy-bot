const { Command } = require("../../structures/index.js");

const titleOptions = [
    { value: "welcome", label: "𝐖𝐄𝐋𝐂𝐎𝐌𝐄", link: "https://i.imgur.com/U9kSL2X.png" }, // DONE
    { value: "announcement", label: "𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄𝐌𝐄𝐍𝐓", link: "" },
    { value: "rules", label: "𝐑𝐔𝐋𝐄𝐒", link: "https://i.imgur.com/PRdNEPq.png" }, // DONE
    { value: "roles", label: "𝐑𝐎𝐋𝐄𝐒", link: "" },
    { value: "contact", label: "𝐂𝐎𝐍𝐓𝐀𝐂𝐓", link: "https://i.imgur.com/Y0PFW1k.png" }, // DONE
    { value: "donate", label: "𝐃𝐎𝐍𝐀𝐓𝐄", link: "https://i.imgur.com/grvQy0M.png" }, // DONE
    { value: "aboutme", label: "𝐀𝐁𝐎𝐔𝐓 𝐌𝐄", link: "https://i.imgur.com/qfAB49W.png" }, // DONE
    { value: "faq", label: "𝐅𝐀𝐐", link: "https://i.imgur.com/O5N910Z.png" }, // DONE
    { value: "discord", label: "𝐃𝐈𝐒𝐂𝐎𝐑𝐃", link: "https://i.imgur.com/mubMrz3.png" },
    { value: "website", label: "𝐖𝐄𝐁𝐒𝐈𝐓𝐄", link: "https://i.imgur.com/DgersSB.png" }, // DONE
    { value: "giveaways", label: "𝐆𝐈𝐕𝐄𝐀𝐖𝐀𝐘𝐒", link: "https://i.imgur.com/DSMNYsY.png" }, // DONE
    { value: "games", label: "𝐆𝐀𝐌𝐄𝐒", link: "https://i.imgur.com/FHlqsJA.png" }, // DONE
    { value: "tip", label: "𝐓𝐈𝐏𝐒", link: "https://i.imgur.com/56BnJXN.png" }, // DONE
];

module.exports = class Embed extends Command {
    constructor(client) {
        super(client, {
            name: "embed",
            description: {
                content: "𝑪𝒓𝒆𝒂𝒕𝒆𝒔 𝒂𝒏 𝒆𝒎𝒃𝒆𝒅 𝒎𝒆𝒔𝒔𝒂𝒈𝒆",
                examples: ["embed title:faq description:This is an embed"],
                usage: "embed <title:TITLE> <description:DESCRIPTION> [fields:FIELD1,FIELD2]",
            },
            category: "utility",
            aliases: ["rich", "embedmsg"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "title",
                    description: "Select the title",
                    type: 3, // STRING type
                    required: true,
                    choices: titleOptions.map(option => ({ name: option.label, value: option.value })),
                },
                {
                    name: "description",
                    description: "Description of the embed",
                    type: 3, // STRING type
                    required: true,
                },
                {
                    name: "image",
                    description: "Image URL for the embed",
                    type: 11, // ATTACHMENT type
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search.replace("%{loading}", emoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace("%{loading}", emoji.searching));
        }

        const titleStr = ctx.isInteraction
            ? ctx.interaction.options.getString("title")
            : args[0];
        const title = titleOptions.find(option => option.value === titleStr) || titleStr;
        const description = ctx.isInteraction
            ? ctx.interaction.options.getInteger("description")
            : args[1];

        let imageURL;
        if (ctx.isInteraction) {
            const attachment = ctx.interaction.options.getAttachment("image");
            imageURL = attachment ? attachment.url : title.link;
        }

        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace("%{mainLeft}", emoji.mainLeft)
                    .replace("%{title}", title.label)
                    .replace("%{mainRight}", emoji.mainRight) +
                description
            )
            .setFooter({
                text: `© 𝐂𝐨𝐩𝐲𝐫𝐢𝐠𝐡𝐭 𝐁𝐲 ${ctx.author.displayName}`,
                iconURL: 'https://i.imgur.com/HTSTK1c.png',
            })
            .setTimestamp();

        if (imageURL) embed.setImage(imageURL);

        return ctx.isInteraction
            ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
            : await ctx.editMessage({ content: "", embeds: [embed] });
    }
};
