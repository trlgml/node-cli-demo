const commands = require('../src/index');
const program = require('commander');

commands.register(program);

program.parse(process.argv);