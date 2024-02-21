const { Client, GatewayIntentBits, ApplicationCommandType } = require("discord.js");
const { getAllAudioUrls } = require("google-tts-api");
const { Player, useMainPlayer } = require("discord-player");
const { createAudioResource } = require("discord-voip");
const { default: axios } = require("axios");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const client = new Client({
        intents: [
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.MessageContent,
        ],
});

const player = new Player(client);

(async () => {
        await player.extractors.loadDefault();
})();

client.on("ready", async () => {
        console.log(`bot is online`);

        // await client.application.commands.set([]);
        client.guilds.cache.get("848841415940898827", "1119784455121416202").commands.set([
                {
                        name: "join",
                        description: `join your voice channel`,
                        type: ApplicationCommandType.ChatInput,
                },
        ]);
});

client.on("messageCreate", async (message) => {
        if (message.author.bot || !message.guild) return;

        if (message.guild.members.me.voice.channel) {
                const player = useMainPlayer();
                const queue = player.nodes.create(message.guildId);
                const url = `https://chatbot-api.vercel.app/api/?message=${encodeURIComponent(message.content)}`;
                const response = await axios.get(url).then((response) => response.data);

                try {
                        const url = getAllAudioUrls(response.message, {
                                lang: "en",
                                slow: false,
                                host: "https://translate.google.com",
                        });

                        const res = createAudioResource(url[0].url);

                        await queue.node.playRaw(res);
                } catch (error) {
                        console.error(error);
                }
        }
});

client.on("interactionCreate", async (interaction) => {
        if (interaction.isChatInputCommand()) {
                if (interaction.commandName === "join") {
                        const channel = interaction.member.voice.channel;
                        const player = useMainPlayer();
                        const queue = player.nodes.create(interaction.guildId);

                        if (!channel)
                                return interaction.reply({ content: "You are not connected to a voice channel!", ephemeral: true });
                        await interaction.deferReply();

                        try {
                                await queue.connect(interaction.member.voice.channel, { deaf: true });

                                return interaction.followUp(`Playing something.`);
                        } catch (e) {
                                return interaction.followUp(`Something went wrong: ${e}`);
                        }
                }
        }
});

client.on("error", (err) => {
        console.log(err.stack);
});
 
client.login("p" + process.env.TOKEN);