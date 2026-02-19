import RoleModel, { Role } from "../models/role.model";
import MenuModel from "../models/menu.model";
import AppError from "../errors/appError";

export const createRole = async (data: Partial<Role>) => {
  return await RoleModel.create(data);
};

export const syncRolePermissions = async (
  roleId: string,
  menuIds: string[],
) => {
  const menus = await MenuModel.find({ _id: { $in: menuIds } });

  const claimSet = new Set<string>();
  menus.forEach((menu) => {
    menu.associatedClaims?.forEach((claimId) => {
      claimSet.add(claimId.toString());
    });
  });

  const updatedRole = await RoleModel.findByIdAndUpdate(
    roleId,
    {
      menus: menuIds,
      claims: Array.from(claimSet),
    },
    { new: true },
  ).populate("menus claims");

  if (!updatedRole) throw new AppError("Role not found", 404);

  return updatedRole;
};

export const findRoleByName = async (name: string) => {
  return await RoleModel.findOne({ name });
};

export const updateRole = async (id: string, data: Partial<Role>) =>
  await RoleModel.findByIdAndUpdate(id, data, { new: true });

export const deleteRole = async (id: string) =>
  await RoleModel.findByIdAndDelete(id);

export const assignClaimToRole = async (roleId: string, claimId: string) => {
  return await RoleModel.findByIdAndUpdate(
    roleId,
    { $addToSet: { claims: claimId } },
    { new: true },
  );
};
