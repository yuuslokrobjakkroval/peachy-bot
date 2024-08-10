const {Command} = require("../../structures");
const { getUser, gif, SimpleEmbed, sym} = require('../../functions/function');

class Background extends Command {
    constructor(client) {
        super(client, {
            name: "background",
            description: {
                content: "",
                examples: "",
                usage: "",
            },
            category: "social",
            aliases: ["background", "bg"],
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
                    name: 'user',
                    description: 'The user whose background you want to see',
                    type: 6, // USER type
                    required: false,
                }
            ],
        });
    }

    async run(client, ctx, args) {
        try{
            const user = ctx.author;
            const userData = await getUser(user.id);

            const background_id = args[0];

            if(['jjk', 'op', 'opm', 'ds', 'cg', 'nt', 'nm', 'ms', 'cm', 'kof', 'kn8'].includes(background_id)){
                for(const bg of userData.bg){
                    const str = `${bg}`;
                    if(str.includes(background_id)){
                        userData.lvl_bg = background_id;
                        ctx.channel.send({ embeds: [SimpleEmbed(`<@${user.id}> has changed Background to ${sym}${background_id}${sym}${gif.bg_gif}`)] });
                        await userData.save();
                        return;
                    }
                }
            }else if(background_id === 'remove'){
                userData.lvl_bg = '';
                message.channel.send({ embeds: [SimpleEmbed(`<@${user.id}> has removed Background`)] });
                await userData.save();
                return;
            }

            return;
        } catch(error){
            console.log(`background error ${error}`);
        }
    };
}

module.exports = Background;