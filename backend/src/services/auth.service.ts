import { CONFLICT, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../constants/http";
import { createSession, findSessionById, updateSessionTime } from '../repositories/session.repo';
import { createUser, findUserByEmail } from "../repositories/user.repo";

import appAssert from "../utils/appAssert";
import { ONE_DAY_IN_MILISECONDS } from "../utils/date";
import { RefreshTokenPayload, RefreshTokenSignOptions, signToken, verifyToken } from '../utils/jwt';

export type AuthParams = {
    email: string;
    password: string;
    userAgent?: string;
};

export const createAccount = async ({ email, playerName, password, userAgent }: AuthParams & { playerName: string }) => {
    const existingUser = await findUserByEmail(email);
    appAssert(!existingUser, CONFLICT, "User already exists");

    const user = await createUser(email, playerName, password);
    appAssert(user, INTERNAL_SERVER_ERROR, "Failed to create user");

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


export const refreshUserAccessToken = async (refreshToken: string) => {
    const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
        secret: RefreshTokenSignOptions.secret,
    });

    appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

    const session = await findSessionById(payload.sessionId);
    
    const now = Date.now();
    appAssert(
        session && session.expiresAt.getTime() > now, 
        UNAUTHORIZED, 
        "Session expired"
    );

    const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_IN_MILISECONDS;

    if (sessionNeedsRefresh) {
        await updateSessionTime(session.id);
    }

    const accessToken = signToken({
        sessionId: session.id,
        userId: session.user.id,
    });

    const newRefreshToken = signToken({ sessionId: session.id }, RefreshTokenSignOptions);

    return {
        accessToken,
        newRefreshToken,
    };

}