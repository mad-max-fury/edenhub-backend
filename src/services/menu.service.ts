import MenuModel, { Menu } from "../models/menu.model";

export const createMenu = async (data: Partial<Menu>) =>
  await MenuModel.create(data);

export const updateMenu = async (id: string, data: Partial<Menu>) =>
  await MenuModel.findByIdAndUpdate(id, data, { new: true });

export const deleteMenu = async (id: string) => {
  await MenuModel.updateMany({ parentId: id }, { $set: { parentId: null } });
  return await MenuModel.findByIdAndDelete(id);
};
