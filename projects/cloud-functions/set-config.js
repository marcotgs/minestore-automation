const fs = require('fs');
const { exec } = require('shelljs');
const { red, whiteBright } = require('chalk');
const log = console.log;

const env = process.argv[2];
const configPath = `./config/environment/.env.${env}.js`;

if (!(configPath && fs.existsSync(configPath))) {
	log(red(`\n Environment file ${whiteBright(configPath)} not found!`));
	return;
}

const collectConfigLines = async () => {
	const configLines = [];
	const { default: configs } = await import(configPath);
	Object.keys(configs).forEach((key) => {
		const config = configs[key];
		const configLine = typeof config === 'string' ? config : `'${JSON.stringify(config)}'`;
		configLines.push(`env.${key.toLowerCase()}=${configLine}`);
	});
	return configLines;
};

collectConfigLines().then((config) => {
	const commands = [
		'firebase functions:config:unset env',
		`firebase functions:config:set ${config.join(' ')}`,
		'firebase functions:config:get > .runtimeconfig.json',
	];
	exec(commands.join(' && '));
});
