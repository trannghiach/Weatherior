import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import { deleteSession } from "../repositories/session.repo";
import { find } from "../repositories/user.repo";
import { createAccount, loginUser } from "../services/auth.service";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies";
import { verifyToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "./auth.schema";

export const registerHandler = catchErrors(async (req, res) => {
    const request = registerSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    })

    const { user, accessToken, refreshToken } = await createAccount(request);

    return setAuthCookies({ res, refreshToken, accessToken })
        .status(CREATED)
        .json(user);
});


export const loginHandler = catchErrors(async (req, res) => {
    const request = loginSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    })

    const { accessToken, refreshToken } = await loginUser(request);

    return setAuthCookies({ res, refreshToken, accessToken })
        .status(OK)
        .json({
            message: "Successfully logged in!",
        })
});


export const logoutHandler = catchErrors(async (req, res) => {
    const accessToken = req.cookies.accessToken as string | undefined;
    appAssert(accessToken, UNAUTHORIZED, "Missing Access Token");

    const { payload } = verifyToken(accessToken);

    if (payload) {
        await deleteSession(payload.sessionId);
    }

    return clearAuthCookies(res)
        .status(OK)
        .json({
            message: "Logged out!",
        });
});

// for debug
export const getUsersHandler = catchErrors(async (req, res) => {
    const users = await find();
    appAssert(users, UNAUTHORIZED, "No users found");
    return res.json(users);
});

