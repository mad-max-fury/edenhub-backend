import UserModal, { User } from "../models/user.model";
import log from "../utils/logger";

export async function createUser(input: Partial<User>) {
  try {
    return UserModal.create(input);
  } catch (e: any) {
    log.error(e);
    return {
      status: "failed",
      error: e,
    };
  }
}
