const { Command } = require("../../structures/index.js");

class RemindMe extends Command {
  constructor(client) {
    super(client, {
      name: "remindme",
      description: {
        content: "Sets a reminder for the user after a specified time",
        examples: ['remindme 10m "Take a break!"'],
        usage: 'remindme <time> <message>',
      },
      category: "utility",
      aliases: ["reminder"],
      cooldown: 5,
      args: true,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "time",
          description: "The time after which to send the reminder (e.g., 10m, 1h)",
          type: 3, // STRING type
          required: true,
        },
        {
          name: "message",
          description: "The reminder message",
          type: 3, // STRING type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args) {
    const [time, ...message] = args;
    const ms = this.parseTime(time);
    if (!ms) return ctx.sendMessage("Please provide a valid time format (e.g., 10m, 1h).");

    ctx.sendMessage(`I will remind you in ${time}: "${message.join(" ")}"`);

    setTimeout(() => {
      ctx.sendMessage(`${ctx.author}, here's your reminder: "${message.join(" ")}"`);
    }, ms);
  }

  parseTime(time) {
    const timeFormat = time.match(/(\d+)([smhd])/);
    if (!timeFormat) return null;
    const value = parseInt(timeFormat[1]);
    const unit = timeFormat[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 1000 * 60;
      case "h":
        return value * 1000 * 60 * 60;
      case "d":
        return value * 1000 * 60 * 60 * 24;
      default:
        return null;
    }
  }
}

module.exports = RemindMe;
