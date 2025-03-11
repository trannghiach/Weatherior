import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_SECRET } from '../constants/env';


export type RefreshTokenPayload = {
    sessionId: string;
};

export type AccessTokenPayload = {
    sessionId: string;
    userId: string;
};

type SignOptionsWithSecret = SignOptions & {
    secret: string;
};

const defaults: SignOptions = {
    audience: ["user"],
};

const AccessTokenSignOptions: SignOptionsWithSecret = {
    expiresIn: "15m",
    secret: JWT_SECRET,
};

export const RefreshTokenSignOptions: SignOptionsWithSecret = {
    expiresIn: "30d",
    secret: JWT_REFRESH_SECRET,
};

export const signToken = (
    payload: AccessTokenPayload | RefreshTokenPayload,
    options?: SignOptionsWithSecret
) => {
    const { secret, ...signOpts } = options || AccessTokenSignOptions;
    return jwt.sign(payload, secret, {
        ...defaults,
        ...signOpts,
    });
};


export const verifyToken = <TPayload extends object = AccessTokenPayload>(
    token: string,
    options?: VerifyOptions & { 
        secret?: string
     }
) => {
    const { secret = JWT_SECRET, ...verifyOpts } = options || {};
    try {
        const payload = jwt.verify(token, secret, {
            ...defaults,
            ...verifyOpts,
        }) as TPayload;
        return {
            payload
        }
    } catch (error: any) {
        return {
            error: error.message
        }
    }
}