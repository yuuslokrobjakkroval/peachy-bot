const PeachyClient = require("../structures/Client");
const globalConfig = require("../utils/Config");
const KeepAlive = {
	name: "keep-alive",
	version: "1.0.0",
	author: "KYUU",
	/**
	 *
	 * @param {PeachyClient} client
	 */
	initialize: (client) => {
		if (globalConfig.keepAlive) {
			const http = require("node:http");
			const server = http.createServer((req, res) => {
				res.writeHead(200, { "Content-Type": "text/plain" });
				res.end(
					`I'm alive! Currently serving ${client.guilds.cache.size} guilds.`,
				);
			});
			server.listen(3000, () => {
				client.logger.info("Keep-Alive server is running on port 3000");
			});
		}
	},
};

module.exports = KeepAlive;
