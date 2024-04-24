import os from 'os';
import dotenv from 'dotenv';

import { program } from 'commander';

import logger from "utils/logger.mjs";
import * as config from "utils/config.mjs";
import * as dbconnman from "utils/dbconn.mjs";

program.name('formfactor').
  description('cli tool for running migration');

program.command('migrate').
  description('Run database migration').
  requiredOption('-c, --config <config>', 'Path to config file').
  requiredOption('-d, --dsn <dsn>', 'DSN to use mysql/mongo').
  option('-f, --file <file>', 'File path').
  action(async (options) => {
    const conf = config.GetConfig(options.config);

    if (options.dsn == "mongo") {
      logger.info("setting up mongodb collections")

      try {
        const conn = new dbconnman.MongoDBConnector(conf.mongo_url);
        await conn.connect();
        await conn.setup(conf.mongo_db_name);

        process.exit(0)
      } catch (e) {
        throw e
      }
    } else if (options.dsn == "mysql") {
      logger.info("running mysql migrations");

      try {
        const conn = new dbconnman.MySQLConnector(conf.mysql_url, conf.mysql_db_name);
        await conn.connect();
        await conn.setup(options.file);

        process.exit(0)

        return
      } catch (e) {
        throw e
      }
    }
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
