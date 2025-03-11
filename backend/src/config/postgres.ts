import { NODE_ENV, POSTGRES_URI } from '../constants/env';
import "reflect-metadata";
import { DataSource } from "typeorm"
import { User } from "../models/user.model";
import { Session } from "../models/session.model";
import { Match } from '../models/match.model';
import { Ranking } from '../models/ranking.model';

export const PostgresDataSource = new DataSource({
    type: "postgres",
    url: POSTGRES_URI,
    entities: [User, Session, Match, Ranking],
    synchronize: NODE_ENV === "development",
    logging: NODE_ENV === "development",
    extra: {
        ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    }
});

const connectToPostgres = async () => {
    try {
        await PostgresDataSource.initialize();
        console.log("Succesfully connected to the PostgreSQL");
    } catch (error) {
        console.log(`Failed connecting to the PostgreSQL: `, error);
        process.exit(1);
    }
}

export default connectToPostgres;
