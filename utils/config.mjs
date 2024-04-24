import dotenv from 'dotenv';

let AppConfig = {
  env: '',
  port: 0,
  mongo_url: '',
  mongo_db_name: '',
  mysql_url: '',
  mysql_db_name: '',
  redis_url: '',
};

export function GetConfig(filePath) {
  if (!!AppConfig.env) {
    return AppConfig
  }

  dotenv.config({ path: filePath });

  AppConfig = {
    env: process.env.ENVIRONMENT,
    port: process.env.PORT,
    mongo_url: process.env.MONGO_DB_URL,
    mongo_db_name: process.env.MONGO_DB_NAME,
    mysql_url: process.env.MYSQL_DB_URL,
    mysql_db_name: process.env.MYSQL_DB_NAME,
    redis_url: process.env.REDIS_DB_URL,
  }

  return AppConfig
}
