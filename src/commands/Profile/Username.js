const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class Username extends Command {
  constructor(client) {
    super(client, {
      name: "username",
      description: {
        content: "𝑺𝒆𝒕, 𝒓𝒆𝒔𝒆𝒕, 𝒉𝒆𝒍𝒑, 𝒐𝒓 𝒔𝒉𝒐𝒘𝒔 𝒚𝒐𝒖𝒓 𝒖𝒔𝒆𝒓𝒏𝒂𝒎𝒆.",
        examples: ["username peachy", "username reset", "username help"],
        usage: "username <text || reset || help>",
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
          name: "reset",
          description: "Resets the username to the default one",
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
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const userNameMessages = language.locales.get(language.defaultLocale)
      ?.profileMessages?.userNameMessages;

    client.utils.getUser(ctx.author.id).then((user) => {
      const embed = client.embed();

      const subCommand = ctx.isInteraction
        ? ctx.interaction.options.data[0].name
        : args[0];

      switch (subCommand) {
        case "help": {
          embed
            .setColor(color.main)
            .setDescription(
              generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "𝐔𝐒𝐄𝐑𝐍𝐀𝐌𝐄")
                .replace("%{mainRight}", emoji.mainRight) +
                userNameMessages.help.usage +
                "\n\n**Examples:**\n" +
                userNameMessages.help.examples
                  .map((example) => `\`${example}\``)
                  .join("\n")
            )
            .setFooter({
              text:
                generalMessages?.requestedBy.replace(
                  "%{username}",
                  ctx.author.displayName
                ) || `Request By ${ctx.author.displayName}`,
              iconURL: ctx.author.displayAvatarURL(),
            });

          ctx.sendMessage({ embeds: [embed] });
          break;
        }

        case "reset": {
          embed
            .setColor(color.main)
            .setDescription(
              generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "𝐔𝐒𝐄𝐑𝐍𝐀𝐌𝐄")
                .replace("%{mainRight}", emoji.mainRight) +
                userNameMessages.reset
            )
            .setFooter({
              text:
                generalMessages?.requestedBy.replace(
                  "%{username}",
                  ctx.author.displayName
                ) || `Request By ${ctx.author.displayName}`,
              iconURL: ctx.author.displayAvatarURL(),
            });

          user.profile.username = "No username set.";
          user.save();

          ctx.sendMessage({ embeds: [embed] });
          break;
        }

        default: {
          const text = ctx.isInteraction
            ? ctx.interaction.options.data[0]?.options[0]?.value?.toString()
            : args.join(" ");

          if (text) {
            if (text.length > 20) {
              client.utils.oops(
                client,
                ctx,
                userNameMessages.error.long,
                color
              );
              return;
            }

            embed
              .setColor(color.main)
              .setDescription(
                generalMessages.title
                  .replace("%{mainLeft}", emoji.mainLeft)
                  .replace("%{title}", "𝐔𝐒𝐄𝐑𝐍𝐀𝐌𝐄")
                  .replace("%{mainRight}", emoji.mainRight) +
                  userNameMessages.success.replace("%{username}", text)
              )
              .setFooter({
                text:
                  generalMessages?.requestedBy.replace(
                    "%{username}",
                    ctx.author.displayName
                  ) || `Request By ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
              });

            user.profile.username = text;
            user.save();

            ctx.sendMessage({ embeds: [embed] });
          } else {
            embed
              .setColor(color.main)
              .setDescription(
                generalMessages.title
                  .replace("%{mainLeft}", emoji.mainLeft)
                  .replace("%{title}", "𝐔𝐒𝐄𝐑𝐍𝐀𝐌𝐄")
                  .replace("%{mainRight}", emoji.mainRight) +
                  userNameMessages.name.replace(
                    "%{username}",
                    user.profile.username || userNameMessages.noUsername
                  )
              )
              .setFooter({
                text:
                  generalMessages?.requestedBy.replace(
                    "%{username}",
                    ctx.author.displayName
                  ) || `Request By ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
              });

            ctx.sendMessage({ embeds: [embed] });
            break;
          }
          break;
        }
      }
    });
  }
};
