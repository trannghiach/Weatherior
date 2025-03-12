import { PostgresDataSource } from "../config/postgres";
import { Session } from "../models/session.model";
import { User } from "../models/user.model";
import { thirtyDaysFromNow } from "../utils/date";

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

export const findSessionById = async (sessionId: string) => {
  return await sessionRepo.findOne({ 
    where: { id: sessionId },
    relations: ["user"],
  });
}

export const updateSessionTime = async (sessionId: string) => {
  // Update session time to 30 days from now
  return await sessionRepo.update(sessionId, { expiresAt: thirtyDaysFromNow() });
}