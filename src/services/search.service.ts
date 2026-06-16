import ProductModel from "../models/product.model";
import OrderModel from "../models/order.model";
import CategoryModel from "../models/category.model";
import UserModel from "../models/user.model";

export interface SearchHit {
  id: string;
  type: "product" | "order" | "customer" | "category";
  title: string;
  subtitle?: string;
  image?: string;
}

export interface GlobalSearchResult {
  products: SearchHit[];
  orders: SearchHit[];
  customers: SearchHit[];
  categories: SearchHit[];
  total: number;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG")}`;

// Cross-entity search for the admin global search bar. Each group is capped so
// the dropdown stays light; the frontend links to the full filtered list.
export const globalSearch = async (
  term: string,
  perGroup = 5,
): Promise<GlobalSearchResult> => {
  const q = term.trim();
  if (!q) {
    return { products: [], orders: [], customers: [], categories: [], total: 0 };
  }

  const rx = new RegExp(escapeRegex(q), "i");

  const [products, orders, customers, categories] = await Promise.all([
    ProductModel.find({
      $or: [{ name: rx }, { brand: rx }, { "variants.sku": rx }],
    })
      .select("name brand coverImage status")
      .limit(perGroup)
      .lean(),

    OrderModel.find({
      $or: [{ orderNumber: rx }, { "shippingAddress.fullName": rx }],
    })
      .select("orderNumber grandTotal status")
      .sort("-createdAt")
      .limit(perGroup)
      .lean(),

    UserModel.find({
      role: { $exists: true },
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }],
    })
      .select("firstName lastName email profilePicture")
      .limit(perGroup)
      .lean(),

    CategoryModel.find({ $or: [{ name: rx }, { slug: rx }] })
      .select("name slug level")
      .limit(perGroup)
      .lean(),
  ]);

  const productHits: SearchHit[] = products.map((p: any) => ({
    id: String(p._id),
    type: "product",
    title: p.name,
    subtitle: [p.brand, p.status].filter(Boolean).join(" · "),
    image: p.coverImage,
  }));

  const orderHits: SearchHit[] = orders.map((o: any) => ({
    id: String(o._id),
    type: "order",
    title: o.orderNumber,
    subtitle: `${money(o.grandTotal)} · ${o.status}`,
  }));

  const customerHits: SearchHit[] = customers.map((u: any) => ({
    id: String(u._id),
    type: "customer",
    title: `${u.firstName} ${u.lastName}`.trim() || u.email,
    subtitle: u.email,
    image: u.profilePicture,
  }));

  const categoryHits: SearchHit[] = categories.map((c: any) => ({
    id: String(c._id),
    type: "category",
    title: c.name,
    subtitle: `Level ${c.level ?? 1}`,
  }));

  return {
    products: productHits,
    orders: orderHits,
    customers: customerHits,
    categories: categoryHits,
    total:
      productHits.length +
      orderHits.length +
      customerHits.length +
      categoryHits.length,
  };
};
