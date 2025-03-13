import { NOT_FOUND, OK } from "../constants/http";
import { findUserById } from "../repositories/user.repo";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await findUserById(req.userId);
  appAssert(user, NOT_FOUND, "User not found");
  res.status(OK).json(user.omitPassword());
});
