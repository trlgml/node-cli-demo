const commandList = [
  require('./init'),
  require('./version'),
];
exports.register = (program) => {
  commandList.forEach((command) => {
    command.register(program);
  });
};