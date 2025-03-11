import { PostgresDataSource } from "../config/postgres";
import { User } from "../models/user.model";

const userRepo = PostgresDataSource.getRepository(User);

export const createUser = async (email: string, password: string) => {
  const user = new User();
  user.email = email;
  user.password = password;
  return await userRepo.save(user);
};

export const findUserByEmail = async (email: string) => {
  return await userRepo.findOne({ where: { email } });
};

// for debug
export const find = async () => {
  return await userRepo.find();
}
