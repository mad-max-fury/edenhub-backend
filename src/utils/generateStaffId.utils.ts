import UserModel from "../models/user.model";

export const generateStaffId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `EHW-${year}-`;

  const lastStaff = await UserModel.findOne({
    staffId: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .select("staffId");

  let nextNumber = 1;
  if (lastStaff?.staffId) {
    const lastNumber = parseInt(lastStaff.staffId.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  const formattedNumber = nextNumber.toString().padStart(4, "0");
  return `${prefix}${formattedNumber}`;
};
