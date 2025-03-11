import { NODE_ENV, POSTGRES_URI } from '../constants/env';
import "reflect-metadata";
import { DataSource } from "typeorm"
import { User } from "../models/user.model";
import { Session } from "../models/session.model";

export const PostgresDataSource = new DataSource({
    type: "postgres",
    url: POSTGRES_URI,
    entities: [User, Session],
    synchronize: NODE_ENV === "development",
    logging: true
});

export const userRepo = PostgresDataSource.getRepository(User);
export const sessionRepo = PostgresDataSource.getRepository(Session);

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
