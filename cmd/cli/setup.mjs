import os from 'os';
import dotenv from 'dotenv';

import { program } from 'commander';

import logger from "utils/logger.mjs";


program.name('formfactor').
  description('cli tool for running migration');

program.command('migrate').
  description('Run database migration').
  requiredOption('-c, --config <config>', 'Path to config file').
  requiredOption('-d, --dsn <dsn>', 'DSN to use mysql/mongo').
  requiredOption('-f, --file <file>', 'File path').
  action((options) => {
    logger.info(`Config file ${options.config} Dsn ${options.dsn} Path ${options.file}`);
  });

program.command('seed').
  description('Seed data for database').
  requiredOption('-c, --config <config>', 'Path to config file').
  requiredOption('-d, --dsn <dsn>', 'DSN to use mysql/mongo').
  requiredOption('-f, --file <file>', 'File path').
  action((options) => {
    logger.info(`Config file ${options.config} Dsn ${options.dsn} Path ${options.file}`);
  });


program.parse(process.argv);
