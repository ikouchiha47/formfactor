import { program } from 'commander';

import logger from "utils/logger.mjs";
import * as config from "utils/config.mjs";
import * as dbconnman from "utils/dbconn.mjs";
import { OrgRepository } from 'user-org-service/organisations.mjs';
import { User, UserOrgService, UserTypes, UsersRepository } from 'user-org-service/users.mjs';

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

      } catch (e) {
        throw e
      }
    }
  });

program.command('seed').
  description('Seed data for database').
  requiredOption('-c, --config <config>', 'Path to config file').
  action(async (options) => {

    const conf = config.GetConfig(options.config);

    // logger.info("setting up mongodb collections")

    // try {
    //   const conn = new dbconnman.MongoDBConnector(conf.mongo_url);
    //   await conn.connect();
    //   await conn.setup(conf.mongo_db_name);
    // } catch (e) {
    //   throw e
    // }


    try {
      const conn = new dbconnman.MySQLConnector(conf.mysql_url, conf.mysql_db_name);
      await conn.connect();

      const orgDomains = [["@foobar.com", "Foo Bar"], ["@barfoo.com", "Bar Foo"]]

      const orgRepo = new OrgRepository(conn.connection)
      
      var results = await Promise.allSettled(
        orgDomains.map(domain => orgRepo.create(domain[0], domain[1]))
      )

      // const orgs = results.map(result => result.value).map(org => org.id)
      // const orgs = ['01HW840WXF5TXPZW61FK2BCXXK', '01HW840WXDYJPJJ0SC41AJJVJR']

      const users = [
        {
          email: "admin@foobar.com",
          password: "dalaillama",
          userType: UserTypes.ORG_ADMIN,
        },
        {
          email: "llama@foobar.com",
          password: "dalaillama",
          userType: UserTypes.ORG_USER,
        },
        {
          email: "admin@barfoo.com",
          password: "alpacaa",
          userType: UserTypes.ORG_USER,
        },
        // { //Testcase for invalid org domain
        //   email: "invalid@domain.com",
        //   password: "invalid",
        //   userType: UserTypes.ORG_USER,
        // },
    ]

    const userRepo = new UsersRepository(conn.connection)    
    const userOrgSvc = new UserOrgService(userRepo, orgRepo);

    var results = await Promise.allSettled(
      users.map(user => {
        return userOrgSvc.createUser(user.userType, user.email, user.password)
      })
    )

      console.dir(results)
      process.exit(0)
      
    } catch (e) {
      throw e
    }



  });


program.parse(process.argv);
