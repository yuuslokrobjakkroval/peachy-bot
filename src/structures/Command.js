const Permissions = require('../utils/Permissions');

module.exports = class Command {
	constructor(client, options = {}) {
		this.client = client;
		this.name = options.name;
		this.nameLocalizations = options.nameLocalizations;
		this.description = {
			content: options.description
				? options.description.content || 'No description provided'
				: 'No description provided',
			usage: options.description
				? options.description.usage || 'No usage provided'
				: 'No usage provided',
			examples: options.description
				? options.description.examples || ['']
				: [''],
		};
		this.descriptionLocalizations = options.descriptionLocalizations;
		this.aliases = options.aliases || [];
		this.cooldown = options.cooldown || 3;
		this.args = options.args || false;
		this.player = {
			voice: options.player ? options.player.voice || false : false,
			dj: options.player ? options.player.dj || false : false,
			active: options.player ? options.player.active || false : false,
			djPerm: options.player ? options.player.djPerm || null : null,
		};
		this.permissions = {
			owner: options.permissions ? options.permissions.owner || false : false,
			dev: options.permissions ? options.permissions.dev || false : false,
			staff: options.permissions ? options.permissions.staff || false : false,
			client: options.permissions
				? options.permissions.client || []
				: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
			user: options.permissions ? options.permissions.user || [] : [],
		};

		// explicit required permission numeric level (preferred)
		// Accepts numeric or string like 'OWNER', 'DEV', 'STAFF', 'PARTNER', 'PLAYER', 'EVERYONE'
		if (typeof options.requiredPermission === 'number') {
			this.requiredPermission = options.requiredPermission;
		} else if (typeof options.requiredPermission === 'string') {
			this.requiredPermission = Permissions.LEVELS[options.requiredPermission.toUpperCase()] ?? Permissions.LEVELS.PLAYER;
		} else {
			// derive from legacy booleans (owner > dev > staff > player)
			if (this.permissions.owner) this.requiredPermission = Permissions.LEVELS.OWNER;
			else if (this.permissions.dev) this.requiredPermission = Permissions.LEVELS.DEV;
			else if (this.permissions.staff) this.requiredPermission = Permissions.LEVELS.STAFF;
			else this.requiredPermission = Permissions.LEVELS.PLAYER;
		}

		this.slashCommand = options.slashCommand || false;
		this.options = options.options || [];
		this.category = options.category || 'general';
	}
	async canRun(context) {
		try {
			const member = context.member;
			const userId = context.author?.id;
			const guild = context.guild;

			// 1) level-based check (owners/devs/roles + DB)
			const allowed = await Permissions.hasPermission(member, userId, this.requiredPermission, guild);
			if (allowed) return true;

			// 2) legacy user permission checks (Discord perms) - optional
			if (Array.isArray(this.permissions.user) && this.permissions.user.length > 0) {
				// context.member.permissions may be undefined in some sharded/custom structures
				const discordPerms = member && member.permissions ? member.permissions : null;
				if (discordPerms && discordPerms.has(this.permissions.user)) return true;
			}

			// 3) Not allowed -> notify
			// try multiple reply methods safely
			if (context.message && typeof context.message.reply === 'function') {
				await context.message.reply('You do not have permission to use this command.');
			} else if (context.reply && typeof context.reply === 'function') {
				await context.reply('You do not have permission to use this command.');
			}
		} catch (err) {
			// swallow to avoid crashing dispatch; command will be blocked
		}
		return false;
	}

	async run(_client, _message, _args) {
		return await Promise.resolve();
	}
};
