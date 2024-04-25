import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';

import { parseArgs } from "node:util";

import logger from "utils/logger.mjs";
import * as config from "utils/config.mjs";
import * as dbconnman from "utils/dbconn.mjs";
import { UserController, UserOrgService, UsersRepository } from 'user-org-service/users.mjs';
import { AuthyService } from 'auth-service/auth.mjs';
import { OrgRepository } from 'user-org-service/organisations.mjs';
import { FormsController, FormsRepository } from 'form-service/form.mjs';
import { AuthorizationMiddleware, ValidateAuthorized } from '../../src/httputils/middleware.mjs';

const args = parseArgs({
  options: {
    envfile: {
      type: "string",
      short: "e",
      default: "./config/.env",
    },
    port: {
      type: "string",
      short: "p",
    },
    verbose: {
      type: "boolean",
      short: "v",
    },
  },
});

const deps = {
  OrgService: (conn) => {
    const orgRepo     = new OrgRepository(conn.connection)
    const userRepo    = new UsersRepository(conn.connection) 
    const userOrgSvc  = new UserOrgService(userRepo, orgRepo)

    return userOrgSvc
  },
  AuthService: (conn) => {
    const authSvc = new AuthyService(conn.connection)
    return authSvc
  },
}

const handlers = {
  LoginHandler: (conn) => {
    return new UserController(deps.OrgService(conn), deps.AuthService(conn))
  },
  FormsHandler: (conn, dbName) => {
    return new FormsController(new FormsRepository(conn.connection, dbName))
  }
}

function noOpHandler(req, res) {
  res.status(500).json({ success: false, error: "not_implemented", errorCode: "G1002"})
}

export const setupApp = async (conf, mongoClient, sqlClient, redisClient) => {
  const app = express();

  const corsOptions = {
    origin: ['http://formfactor.io'],
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'Content-Length'],
  }

  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(bodyParser.json());

  const loginHandler = handlers.LoginHandler(sqlClient)
  const formsHandler = handlers.FormsHandler(mongoClient)

  const authMiddleware = AuthorizationMiddleware(deps.AuthService(sqlClient))

  // TODO: handle rate-limits on user email
  app.post("/auth/login", loginHandler.orgUserLogin.bind(loginHandler))

  //TODO: handle rate-limits on access token
  app.post("/orgs/:orgID/forms", authMiddleware, ValidateAuthorized, formsHandler.create.bind(formsHandler))

  app.get("/orgs/:orgID/forms/:formID", authMiddleware, ValidateAuthorized, formsHandler.viewAnswers.bind(formsHandler))

  // TODO: handle rate limits on req.body.uid (user email)
  app.post("/orgs/:orgID/forms/:formID", authMiddleware, formsHandler.createAnswer.bind(formsHandler))


  let port = Number(process.env.PORT);

  if (!!args.values.port) {
    port = Number(args.values.port);
  }

  app.get('/ping', (req, res) => {
    res.status(200).send("pong")
  })

  app.listen(port, () => {
    logger.info(`App listening on port ${port}`);
  });
}

// const totalCPUs = os.availableParallelism();
const totalCPUs = 2;

if (cluster.isMaster) {
  logger.info(`Number of CPUs ${totalCPUs}`);
  logger.info(`Primary ${process.pid} is running`);

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.info(`worker ${worker.process.pid} died, killed by ${code}, on signal ${signal}`);
    logger.info("Let's fork another worker!");
    // cluster.fork();
  });
} else {
  logger.info(`Worker ${process.pid} started`);

  const conf = config.GetConfig(args.values.envfile);

  const mongoConn = new dbconnman.MongoDBConnector(conf.mongo_url);
  await mongoConn.connect();

  const mysqlConn = new dbconnman.MySQLConnector(conf.mysql_url, conf.mysql_db_name);
  await mysqlConn.connect();

  const redisConn = new dbconnman.RedisConnector(conf.redis_url)
  await redisConn.connect()

  await setupApp(conf, mongoConn, mysqlConn, redisConn);
}
