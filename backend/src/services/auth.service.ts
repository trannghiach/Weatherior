import { sessionRepo, userRepo } from "../config/postgres";
import { CONFLICT, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../constants/http";
import { Session } from "../models/session.model";
import { User } from "../models/user.model";

import appAssert from "../utils/appAssert";
import { RefreshTokenSignOptions, signToken } from '../utils/jwt';


export type AuthParams = {
    email: string;
    password: string;
    userAgent?: string;
};

export const createAccount = async ({ email, password, userAgent }: AuthParams) => {
    const existingUser = await userRepo.findOne({ where: { email } });
    appAssert(!existingUser, CONFLICT, "User already exists");

    const user = new User();
    user.email = email;
    user.password = password;
    await userRepo.save(user);

    appAssert(user, INTERNAL_SERVER_ERROR, "Failed to create user");

    const session = new Session();
    session.userAgent = userAgent;
    session.user = user;
    await sessionRepo.save(session);

    appAssert(session, INTERNAL_SERVER_ERROR, "Failed to create session");

    const refreshToken = signToken({ sessionId: session.id }, RefreshTokenSignOptions);

    const accessToken = signToken({
        sessionId: session.id,
        userId: user.id,
    });

    return {
        user,
        accessToken,
        refreshToken,
    }
};

export const loginUser = async ({ email, password, userAgent }: AuthParams) => {
    const user = await userRepo.findOne({ where: { email } });
    appAssert(user, UNAUTHORIZED, "Incorrect email or password");

    const isCorrectPassword = await user.comparePassword(password);
    appAssert(isCorrectPassword, UNAUTHORIZED, "Incorrect email or password");

    const session = new Session();
    session.userAgent = userAgent;
    session.user = user;
    await sessionRepo.save(session);

    const refreshToken = signToken({ sessionId: session.id }, RefreshTokenSignOptions);

    const accessToken = signToken({
        sessionId: session.id,
        userId: user.id,
    });

    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken,
    }
};
