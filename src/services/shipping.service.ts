import { getConfig } from "../config";
import AppError from "../errors/appError";

const apiKey = () => getConfig("shipbubbleApiKey");
const baseUrl = () => getConfig("shipbubbleBaseUrl");

const shipbubbleFetch = async (path: string, init: RequestInit = {}) => {
  const key = apiKey();
  if (!key) {
    throw new AppError(
      "Shipbubble is not configured. Set SHIPBUBBLE_API_KEY in the environment.",
      500,
    );
  }

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || body?.status === "error" || body?.status === false) {
    throw new AppError(
      body?.message || `Shipbubble request failed (${res.status})`,
      res.status >= 400 && res.status < 500 ? 400 : 502,
    );
  }
  return body;
};

export interface ShipAddressInput {
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Validate an address and return Shipbubble's address_code.
export const validateAddress = async (
  input: ShipAddressInput,
): Promise<string> => {
  const body = await shipbubbleFetch("/shipping/address/validate", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return body.data.address_code;
};

// The store ship-from address code, validated once and cached.
let cachedOriginCode: string | null = null;
export const getOriginAddressCode = async (): Promise<string> => {
  if (cachedOriginCode) return cachedOriginCode;
  const origin = getConfig("shipOrigin");
  cachedOriginCode = await validateAddress({
    name: origin.name,
    email: origin.email,
    phone: origin.phone,
    address: `${origin.address}, ${origin.city}, ${origin.state}, ${origin.country}`,
  });
  return cachedOriginCode;
};

export const getShippingCategories = async () => {
  const body = await shipbubbleFetch("/shipping/labels/categories");
  return body.data;
};

let cachedCategoryId: number | null = null;
const getDefaultCategoryId = async (): Promise<number> => {
  if (cachedCategoryId) return cachedCategoryId;
  const categories = await getShippingCategories();
  cachedCategoryId = categories?.[0]?.category_id ?? categories?.[0]?.id;
  return cachedCategoryId as number;
};

export interface RateItem {
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  weight?: number;
}

export interface CourierRate {
  courierId: string;
  courierName: string;
  serviceCode: string;
  amount: number;
  currency: string;
  deliveryEta?: string;
}

export interface FetchRatesResult {
  requestToken: string;
  receiverAddressCode: string;
  couriers: CourierRate[];
}

export const fetchRates = async (params: {
  receiver: ShipAddressInput;
  items: RateItem[];
  categoryId?: number;
  pickupDate?: string;
}): Promise<FetchRatesResult> => {
  const [senderCode, receiverCode, categoryId] = await Promise.all([
    getOriginAddressCode(),
    validateAddress(params.receiver),
    params.categoryId
      ? Promise.resolve(params.categoryId)
      : getDefaultCategoryId(),
  ]);

  const pickupDate =
    params.pickupDate ||
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const body = await shipbubbleFetch("/shipping/fetch_rates", {
    method: "POST",
    body: JSON.stringify({
      sender_address_code: senderCode,
      reciever_address_code: receiverCode, // Shipbubble's spelling
      pickup_date: pickupDate,
      category_id: categoryId,
      package_items: params.items.map((i) => ({
        name: i.name,
        description: i.description || i.name,
        unit_weight: i.weight ?? 0.5,
        unit_amount: i.unitPrice,
        quantity: i.quantity,
      })),
      package_dimension: { length: 20, width: 15, height: 10 },
    }),
  });

  const couriers: CourierRate[] = (body.data.couriers || []).map((c: any) => ({
    courierId: String(c.courier_id ?? c.courier_image ?? ""),
    courierName: c.courier_name,
    serviceCode: c.service_code,
    amount: c.total ?? c.shipment_total ?? c.fee ?? 0,
    currency: c.currency || "NGN",
    deliveryEta: c.delivery_eta || c.delivery_eta_time,
  }));

  return {
    requestToken: body.data.request_token,
    receiverAddressCode: receiverCode,
    couriers,
  };
};

export interface CreateLabelResult {
  shipbubbleOrderId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  courier?: string;
}

export const createLabel = async (params: {
  requestToken: string;
  serviceCode: string;
  courierId: string;
}): Promise<CreateLabelResult> => {
  const body = await shipbubbleFetch("/shipping/labels", {
    method: "POST",
    body: JSON.stringify({
      request_token: params.requestToken,
      service_code: params.serviceCode,
      courier_id: params.courierId,
    }),
  });

  const d = body.data;
  return {
    shipbubbleOrderId: String(d.order_id ?? d.id),
    trackingNumber: d.tracking_number ?? d.shipment?.tracking_number,
    trackingUrl: d.tracking_url ?? d.shipment?.tracking_url,
    labelUrl: d.label_url ?? d.shipping_label,
    courier: d.courier?.name,
  };
};

export const trackShipment = async (shipbubbleOrderId: string) => {
  const body = await shipbubbleFetch(
    `/shipping/labels/${encodeURIComponent(shipbubbleOrderId)}`,
  );
  return body.data;
};

export const cancelShipment = async (shipbubbleOrderId: string) => {
  const body = await shipbubbleFetch(
    `/shipping/labels/cancel/${encodeURIComponent(shipbubbleOrderId)}`,
    { method: "POST" },
  );
  return body.data;
};
