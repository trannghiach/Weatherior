import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";
import { NODE_ENV } from "../constants/env";

export const REFRESH_PATH = "/auth/refresh"

// chucaobuon: 
// lilsadfoqs: Set cookies with our own configured options
const defaults: CookieOptions = {
    sameSite: "strict",
    httpOnly: true,
    secure: NODE_ENV === "production"
}

export const getAccessTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: fifteenMinutesFromNow()
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: thirtyDaysFromNow(),
    path: REFRESH_PATH
});

type Params = {
    res: Response,
    refreshToken: string,
    accessToken: string
}

// chucaobuon: 
// lilsadfoqs: Special utitlity that helps set tokens to cookies
export const setAuthCookies = ({res, refreshToken, accessToken}: Params) => res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

// chucaobuon: 
// lilsadfoqs: Special utility that helps clear tokens out of cookies
export const clearAuthCookies = (res: Response) => res
    .clearCookie("accessToken")
    .clearCookie("refreshToken", {
        path: REFRESH_PATH
    });