import assert from 'node:assert';
import { HttpStatusCode } from '../constants/http';
import AppErrorCode from '../constants/AppErrorCode';
import AppError from './AppError';


type appAssert = (
    condition: any,
    httpStatusCode: HttpStatusCode,
    message: string,
    appErrorCode?: AppErrorCode
) => asserts condition;

const appAssert: appAssert = (
    condition,
    httpStatusCode,
    message,
    appErrorCode
) => assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;