import "reflect-metadata";
import { Sequelize } from "sequelize-typescript";
import { KnownBot } from "./models/KnownBot";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize({
  dialect: "postgres",
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  models: [KnownBot],
  logging: false,
});
