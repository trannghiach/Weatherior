import { PostgresDataSource } from "../config/postgres";
import { User } from "../models/user.model";

const userRepo = PostgresDataSource.getRepository(User);

export const createUser = async (email: string, playerName: string, password: string) => {
  const user = new User();
  user.email = email;
  user.playerName = playerName;
  user.password = password;
  return await userRepo.save(user);
};

export const findUserByEmail = async (email: string) => {
  return await userRepo.findOne({ where: { email } });
};

export const findUserById = async (id: string) => {
  const user = await userRepo.findOne({ where: { id } });
  return user;
}

// for debug
export const find = async () => {
  return await userRepo.find();
}
