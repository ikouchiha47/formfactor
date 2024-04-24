import { MongoClient, ReadPreference } from 'mongodb';
import mysql from 'mysql2/promise';
import { createClient } from 'redis';
import fs from 'fs';

import logger from "utils/logger.mjs";

export class RedisConnector {
  constructor(uri) {
    this.uri = uri
    this.client = null;
  }

  async connect() {
    if(this.client) {
      return this.client
    }

    try {
      this.client = createClient({url: this.uri});
      logger.info("Connected to Redis successfully");
    } catch (error) {
      logger.error("Error connecting to Redis:", error);
      throw error;
    }
  }

  async setup() {
    return
  }
}

export class MongoDBConnector {
  constructor(uri) {
    this.uri = uri;
    this.client = null;
  }

  async connect() {
    if(this.client) {
      return this.client
    }
    
    try {
      this.client = new MongoClient(
        this.uri, {
        readPreference: ReadPreference.SECONDARY_PREFERRED,
        maxStalenessSeconds: 120,
      });

      await this.client.connect();
      logger.info("Connected to MongoDB successfully");
    } catch (error) {
      logger.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }

  async setup(dbname) {
    try {
      logger.info("Setting up MongoDB...");

      const db = this.client.db(dbname);
      await db.admin().command({ enableSharding: dbname });

      logger.info("sharding enabled")

      const collections = [
        {
          name: "form_objects",
          shardKey: { org_id: "hashed" }
        },
        {
          name: "form_answers",
          shardKey: { org_id: "hashed" }
        }
      ];


      await Promise.allSettled(
        collections.map(collection => db.createCollection(collection.name))
      )

      logger.info("creating collections done")

      await Promise.allSettled(
        collections.map(collection => {
          db.admin().command({
            shardCollection: `${dbname}.${collection.name}`,
            key: collection.shardKey,
          });
        })
      )

      logger.info("setup collection sharding done")

    } catch (error) {
      logger.error("Error setting up MongoDB collections:", error);
      throw error;
    }
  }
}


export class MySQLConnector {
  constructor(uri, dbname) {
    this.uri = uri;
    this.dbname = dbname;
    this.connection = null;
  }

  async connect() {
    if(this.connection) {
      return
    }

    try {
      this.connection = mysql.createPool(this.uri);
      logger.info("Connected to MySQL successfully");
    } catch (error) {
      logger.error("Error connecting to MySQL:", error);
      throw error;
    }
  }

  async setup(sqlFilePath) {
    try {
      logger.info("Migrating MySQL...");
      // Read SQL file
      const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

      // Execute SQL script
      await Promise.allSettled(
        sqlScript.split('---').map(stmt => this.connection.query(stmt))
      );

      logger.info("Migration for MySQL completed successfully");
    } catch (error) {
      logger.error("Error migrating MySQL:", error);
      throw error;
    }
  }
}

