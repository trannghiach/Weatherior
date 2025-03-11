import { PostgresDataSource } from "../config/postgres";
import { Session } from "../models/session.model";
import { User } from "../models/user.model";

const sessionRepo = PostgresDataSource.getRepository(Session);

export const createSession = async (user: User, userAgent?: string) => {
  const session = new Session();
  session.userAgent = userAgent;
  session.user = user;
  return await sessionRepo.save(session);
};

export const deleteSession = async (sessionId: string) => {
  return await sessionRepo.delete(sessionId);
}