import { CONFLICT, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../constants/http";
import { createSession } from "../repositories/session.repo";
import { createUser, findUserByEmail } from "../repositories/user.repo";

import appAssert from "../utils/appAssert";
import { RefreshTokenSignOptions, signToken } from '../utils/jwt';


export type AuthParams = {
    email: string;
    password: string;
    userAgent?: string;
};

export const createAccount = async ({ email, password, userAgent }: AuthParams) => {
    const existingUser = await findUserByEmail(email);
    appAssert(!existingUser, CONFLICT, "User already exists");

    const user = await createUser(email, password);
    appAssert(user, INTERNAL_SERVER_ERROR, "Failed to create user");

    const session = await createSession(user, userAgent);
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
    const user = await findUserByEmail(email);
    appAssert(user, UNAUTHORIZED, "Incorrect email or password");

    const isCorrectPassword = await user.comparePassword(password);
    appAssert(isCorrectPassword, UNAUTHORIZED, "Incorrect email or password");

    const session = await createSession(user, userAgent);
    appAssert(session, INTERNAL_SERVER_ERROR, "Failed to create session");

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
