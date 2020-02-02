import {ConnectionDetails} from "../database/postgres/PostgresMigrator";

export const EVENT_STORE_CONNECTION_DETAILS : ConnectionDetails = {
  host: `/cloudsql/ivycode:europe-west1:ivycode`,
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: 'ivycode'
};
