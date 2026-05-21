module.exports = {
	apps: [
		{
			name: "ecommerce-admin",
			script: "npx",
			args: "serve -s dist -l 8088",
		},
	],
};