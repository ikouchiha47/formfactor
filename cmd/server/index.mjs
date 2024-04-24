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


dotenv.config({ path: args.values.envfile });

export const setupApp = (mongoClient, sqlClient, redisClient) => {
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

  let port = Number(process.env.PORT);

  if (!!args.values.port) {
    port = Number(args.values.port);
  }

  app.listen(port, () => {
    logger.info(`App listening on port ${port}`);
  });
}

const totalCPUs = os.availableParallelism();

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

  setupApp();
}
