const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class Gender extends Command {
  constructor(client) {
    super(client, {
      name: "gender",
      description: {
        content: "𝑺𝒆𝒕, 𝒓𝒆𝒔𝒆𝒕, 𝒐𝒓 𝒔𝒉𝒐𝒘 𝒚𝒐𝒖𝒓 𝒈𝒆𝒏𝒅𝒆𝒓.",
        examples: [
          "gender",
          "gender male",
          "gender female",
          "gender reset",
          "gender help",
        ],
        usage: "gender <male || female || reset || help>",
      },
      category: "profile",
      aliases: [],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "set",
          description: "Sets the gender in profile card",
          type: 1,
          options: [
            {
              name: "text",
              description: "The gender to set (male/female/other).",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "reset",
          description: "Resets the gender to the default one",
          type: 1,
        },
        {
          name: "help",
          description:
            "Displays example and usage information for the command.",
          type: 1,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const genderMessages = language.locales.get(language.defaultLocale)
      ?.profileMessages?.genderMessages;

    const user = await Users.findOne({ userId: ctx.author.id });
    const embed = client
      .embed()
      .setTitle(`${emoji.mainLeft} 𝐆𝐄𝐍𝐃𝐄𝐑 ${emoji.mainRight}`)
      .setColor(color.main);

    const subCommand = ctx.isInteraction
      ? ctx.interaction.options.data[0].name
      : args[0];

    switch (subCommand) {
      case "help": {
        embed.setDescription(
          `${
            genderMessages?.usage || "**Usage:**"
          } \`gender <male || female || reset || help>\`\n\n**Examples:**\n\`gender male\`\n\`gender female\`\n\`gender reset\`\n\`gender help\``
        );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "reset": {
        embed.setDescription(
          genderMessages?.resetSuccess || "Your gender has been reset."
        );

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "profile.gender": "Not specified" } }
        ).exec();
        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "male":
      case "female": {
        const emojiGender =
          subCommand === "male" ? emoji.gender.male : emoji.gender.female;

        embed.setDescription(
          `${
            genderMessages?.setSuccess || "Your gender has been set to"
          } ${client.utils.formatCapitalize(subCommand)} ${emojiGender}.`
        );

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "profile.gender": subCommand } }
        ).exec();
        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      default: {
        const gender = user.profile.gender;
        const emojiGender =
          gender === "male"
            ? emoji.gender.male
            : gender === "female"
            ? emoji.gender.female
            : "";

        embed.setDescription(
          gender
            ? `${
                genderMessages?.current || "Your gender is set to"
              } ${client.utils.formatCapitalize(gender)} ${emojiGender}`
            : genderMessages?.notSpecified || "Your gender is not specified."
        );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }
    }
  }
};
