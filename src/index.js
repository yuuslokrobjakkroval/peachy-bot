const { ShardingManager } = require("discord.js");
const fs = require("fs");
const globalConfig = require("./utils/Config");
const Logger = require("./structures/Logger.js");
const dotenv = require("dotenv");

dotenv.config({ debug: false });

const logger = new Logger();

if (!fs.existsSync("./src/utils/BotLogo.txt")) {
	logger.error("BotLogo.txt file is missing");
	process.exit(1);
}

try {
	const logFile = fs.readFileSync("./src/utils/BotLogo.txt", "utf-8");
	console.log("\x1b[35m%s\x1b[0m", logFile);
} catch (err) {
	logger.error("[CLIENT] An error has occurred :", err);
}

const manager = new ShardingManager("./src/client.js", {
	respawn: true,
	token: globalConfig.token,
	totalShards: "auto",
	shardList: "auto",
});

manager
	.spawn({ amount: manager.totalShards, delay: null, timeout: -1 })
	.then((shards) => {
		logger.start(`[CLIENT] ${shards.size} shard(s) spawned.`);
	})
	.catch((err) => {
		logger.error("[CLIENT] An error has occurred :", err);
	});

manager.on("shardCreate", (shard) => {
	shard.on("clientReady", () => {
		logger.start(`[CLIENT] Shard ${shard.id} connected to Discord's Gateway.`);
	});
});
