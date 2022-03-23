const { projectInstall } = require('pkg-install');
const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const ncp = require('ncp');
const listr = require('listr');
const { promisify } = require('util');
const access = promisify(fs.access);
const copy = promisify(ncp);

exports.register = (program) => {
  program
    .command('init')
    .alias('i')
    .description('Init description')
    .action((name, options, command) => {
      let questions = [
        {
          type: 'input',
          name: 'serviceName',
          message: chalk.green('Please enter service name'),
          validate: async (val) => {
            return !!val
          },
        },
        {
          type: 'list',
          message: function (answers) {
            return chalk.red(`❗️ Directory ${answers.serviceName} already exists! Are you sure you want to continue?`);
          },
          choices: ['continue', 'cancel'],
          name: 'serviceNameConfirm',
          when: async function (answers) {
            const targetFolder = path.join(process.cwd(), answers.serviceName);
            return await fsExists(targetFolder);
          },
          filter: (val) => {
            if (val == 'cancel') {
              process.exit(0);
            }
          },
        },
        {
          type: 'list',
          message: chalk.green('Please choose which project template to use？'),
          name: 'template',
          choices: ['test'],
          filter: function (val) {
            return val.toLowerCase();
          },
        },
        {
          type: 'confirm',
          name: 'install',
          message: chalk.green('Whether to install dependencies？'),
        },
      ];
      console.log(chalk.green('🐨🐨🐨 ' + 'Welcome to demo cli,easy to build demo～🎉🎉🎉'));
      inquirer.prompt(questions).then((answers) => {
        generatorProject(answers);
      });
    });
};

const fsExists = async function (target) {
  let isExist = false;
  try {
    await access(target, fs.constants.R_OK);
    isExist = true;
  } catch (error) {
    isExist = false;
  }
  return isExist;
};

async function generatorProject(answers) {
  const targetDirectory = path.join(process.cwd(), answers.template);
  // template whether isExists
  const templateDirectory = path.resolve(
    `./templates/`,
    answers.template.toLowerCase()
  );
  console.log(templateDirectory);
  answers.targetDirectory = targetDirectory;
  answers.templateDirectory = templateDirectory;
  const isfsExists = await fsExists(templateDirectory);
  if (!isfsExists) {
    console.error('template not exists', chalk.red.bold('ERROR'));
    process.exit(1);
  }
  const tasks = [
    {
      title: 'Copy project template',
      task: async (ctx) => {
        const templateTargetDirectory = await copyTemplate(answers);
        ctx.templateTargetDirectory = templateTargetDirectory;
      },
    },
    {
      title: 'Install dependencies',
      task: (ctx) => initInstall(ctx.templateTargetDirectory),
      enabled: () => answers.install,
    },
  ];
  const listrInstance = new listr(tasks);
  await listrInstance.run();
  console.log(chalk.green.bold('init completed'));
  process.exit(0);
}

async function initInstall(targetFolder) {
  // Check if yarn or NPM is installed
  // Be aware of the NRM source your company uses
  const { stdout } = await projectInstall({
    prefer: 'yarn',
    cwd: targetFolder,
  });
  console.log(chalk.green(`install 完成，进程信息 ${stdout}`))
}

async function copyTemplate(answers) {
  const targetDirectory = path.join(process.cwd(), answers.serviceName);
  let isExist = await fsExists(targetDirectory);
  if (isExist) {
    console.log(chalk.red(`❗️Directory [${answers.serviceName}]already exists`));
    return;
  }
  const source = answers.templateDirectory;
  const target = targetDirectory;
  // copy template --> target
  await copy(source, target, {
    clobber: false,
  });
  return target;
}
