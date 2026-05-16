import { Donation, User } from "../../types";

export type UrgencyLevel = "high" | "medium" | "low" | "none";

export const DEMO_LISTING_PREFIX = "demo-";

export function isDemoListingId(id: string): boolean {
  return id.startsWith(DEMO_LISTING_PREFIX);
}

/** Never surface raw axios/network errors in the UI. */
export function getListingsFetchNotice(err: unknown): string {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  if (
    /network error|failed to fetch|ERR_NETWORK|ECONNREFUSED|timeout/i.test(
      message
    )
  ) {
    return "Live listings are unavailable right now. Showing sample rescues you can browse offline.";
  }

  return "We couldn't refresh listings from the server. Showing sample data until the connection is restored.";
}

export function shouldUseDemoFallback(err: unknown): boolean {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return (
    !message ||
    /network error|failed to fetch|ERR_NETWORK|ECONNREFUSED|timeout|500|502|503/i.test(
      message
    )
  );
}

function asUser(value: unknown): User | undefined {
  if (!value || typeof value !== "object") return undefined;
  const u = value as User;
  if (!u._id && !(u as { name?: string }).name) return undefined;
  return u;
}

/** Map API shapes to the fields ListingCard expects without changing API calls. */
export function normalizeDonation(raw: Donation & Record<string, unknown>): Donation {
  const donor =
    asUser(raw.donor) ??
    asUser(raw.donorId) ??
    ({ _id: "unknown", name: "Community donor", email: "", role: "donor" } as User);

  const claimedBy =
    asUser(raw.claimedBy) ??
    asUser(raw.assignedNGO) ??
    asUser(raw.assignedVolunteer);

  const statusRaw = String(raw.status ?? "pending");
  const status = normalizeStatus(statusRaw);

  return {
    ...raw,
    _id: String(raw._id),
    foodItem: String(raw.foodItem ?? raw.foodType ?? "Surplus food"),
    quantity: String(raw.quantity ?? "—"),
    pickupLocation: String(raw.pickupLocation ?? raw.location ?? "Location TBD"),
    pickupTime: (raw.pickupTime ?? raw.preparedTime ?? raw.expiryTime ?? new Date()) as
      | string
      | Date,
    createdAt: (raw.createdAt ?? new Date()) as string | Date,
    description: raw.description ? String(raw.description) : undefined,
    category: raw.category
      ? String(raw.category)
      : raw.foodType
        ? String(raw.foodType)
        : undefined,
    donor,
    claimedBy,
    status,
  };
}

function normalizeStatus(
  status: string
): Donation["status"] {
  switch (status) {
    case "posted":
      return "pending";
    case "accepted":
    case "picked_up":
      return "claimed";
    case "delivered":
      return "completed";
    case "expired":
      return "completed";
    case "pending":
    case "claimed":
    case "completed":
      return status;
    default:
      return "pending";
  }
}

export function getStatusLabel(status: Donation["status"]): string {
  switch (status) {
    case "pending":
      return "Awaiting pickup";
    case "claimed":
      return "Rescue in progress";
    case "completed":
      return "Delivered";
    default:
      return status;
  }
}

export function getDonorTypeLabel(donor: User): string {
  switch (donor.role) {
    case "donor":
      return "Food donor";
    case "ngo":
      return "NGO";
    case "volunteer":
      return "Volunteer";
    case "admin":
      return "Admin";
    default:
      return "Donor";
  }
}

export function getRescuePartnerLabel(listing: Donation): string | null {
  if (!listing.claimedBy) return null;
  if (listing.claimedBy.role === "ngo") {
    return `NGO · ${listing.claimedBy.name}`;
  }
  if (listing.claimedBy.role === "volunteer") {
    return `Volunteer · ${listing.claimedBy.name}`;
  }
  return listing.claimedBy.name;
}

export function parseDate(value: string | Date | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatPickupEta(pickupTime: string | Date): string {
  const d = parseDate(pickupTime);
  if (!d) return "Pickup window TBD";
  const now = Date.now();
  const diffMs = d.getTime() - now;
  if (diffMs < 0) return "Pickup window started";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Pickup in ~${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) {
    return rem > 0 ? `Pickup in ~${hours}h ${rem}m` : `Pickup in ~${hours}h`;
  }
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatExpiryTiming(
  listing: Donation & { expiryTime?: string | Date }
): string {
  const expiry = parseDate(listing.expiryTime as string | Date | undefined);
  const pickup = parseDate(listing.pickupTime);
  const target = expiry ?? pickup;
  if (!target) return "Freshness window unknown";

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Use soon — window ending";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Best before ~${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Best before ~${hours}h`;
  return `Best before ${target.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function getRescueUrgency(
  listing: Donation & { expiryTime?: string | Date }
): UrgencyLevel {
  if (listing.status !== "pending") return "none";

  const expiry = parseDate(listing.expiryTime as string | Date | undefined);
  const pickup = parseDate(listing.pickupTime);
  const target = expiry ?? pickup;
  if (!target) return "low";

  const hoursLeft = (target.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft <= 0) return "high";
  if (hoursLeft <= 2) return "high";
  if (hoursLeft <= 6) return "medium";
  return "low";
}

export function formatListedAgo(createdAt: string | Date): string {
  const d = parseDate(createdAt);
  if (!d) return "Recently posted";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Posted just now";
  if (mins < 60) return `Posted ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Posted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Posted ${days}d ago`;
}

export function filterListings(
  listings: Donation[],
  filters: { search?: string; foodType?: string; location?: string }
): Donation[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const foodType = filters.foodType?.trim().toLowerCase() ?? "";
  const location = filters.location?.trim().toLowerCase() ?? "";

  return listings.filter((item) => {
    const haystack = [
      item.foodItem,
      item.description,
      item.category,
      item.pickupLocation,
      item.donor?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (search && !haystack.includes(search)) return false;
    if (foodType) {
      const cat = (item.category ?? item.foodItem ?? "").toLowerCase();
      if (!cat.includes(foodType.toLowerCase())) return false;
    }
    if (location && !item.pickupLocation.toLowerCase().includes(location)) {
      return false;
    }
    return true;
  });
}

const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);

export const MOCK_LISTINGS: Donation[] = [
  {
    _id: `${DEMO_LISTING_PREFIX}1`,
    foodItem: "Fresh vegetable trays",
    quantity: "18 kg · ~45 servings",
    pickupLocation: "Green Leaf Catering, Koramangala",
    pickupTime: hoursFromNow(1.5),
    createdAt: new Date(Date.now() - 25 * 60000),
    status: "pending",
    category: "Vegetables",
    description: "Lightly used banquet trays, refrigerated.",
    donor: {
      _id: "demo-donor-1",
      name: "Green Leaf Catering",
      email: "catering@demo.local",
      role: "donor",
    },
    expiryTime: hoursFromNow(3),
  } as Donation,
  {
    _id: `${DEMO_LISTING_PREFIX}2`,
    foodItem: "Assorted sandwiches & wraps",
    quantity: "32 packs",
    pickupLocation: "Sunrise Hotel Kitchen, Indiranagar",
    pickupTime: hoursFromNow(0.75),
    createdAt: new Date(Date.now() - 50 * 60000),
    status: "pending",
    category: "Meals",
    description: "Packed individually, kept chilled.",
    donor: {
      _id: "demo-donor-2",
      name: "Sunrise Hotel",
      email: "kitchen@demo.local",
      role: "donor",
    },
    expiryTime: hoursFromNow(1.25),
  } as Donation,
  {
    _id: `${DEMO_LISTING_PREFIX}3`,
    foodItem: "Sourdough & pastry surplus",
    quantity: "24 loaves + pastries",
    pickupLocation: "Daily Crust Bakery, HSR Layout",
    pickupTime: hoursFromNow(4),
    createdAt: new Date(Date.now() - 2 * 60 * 60000),
    status: "claimed",
    category: "Bakery",
    donor: {
      _id: "demo-donor-3",
      name: "Daily Crust Bakery",
      email: "bakery@demo.local",
      role: "donor",
    },
    claimedBy: {
      _id: "demo-ngo-1",
      name: "Morning Hope Foundation",
      email: "ngo@demo.local",
      role: "ngo",
    },
    expiryTime: hoursFromNow(5),
  } as Donation,
  {
    _id: `${DEMO_LISTING_PREFIX}4`,
    foodItem: "Cooked rice & dal portions",
    quantity: "60 meals",
    pickupLocation: "TechPark Cafeteria, Bellandur",
    pickupTime: hoursFromNow(2),
    createdAt: new Date(Date.now() - 90 * 60000),
    status: "pending",
    category: "Meals",
    donor: {
      _id: "demo-donor-4",
      name: "TechPark Cafeteria",
      email: "cafe@demo.local",
      role: "donor",
    },
    expiryTime: hoursFromNow(2.5),
  } as Donation,
  {
    _id: `${DEMO_LISTING_PREFIX}5`,
    foodItem: "Seasonal fruit boxes",
    quantity: "12 boxes (~8 kg each)",
    pickupLocation: "Wholesale Market Dock, Yelahanka",
    pickupTime: hoursFromNow(6),
    createdAt: new Date(Date.now() - 4 * 60 * 60000),
    status: "pending",
    category: "Fruits",
    donor: {
      _id: "demo-donor-5",
      name: "Ravi's Produce Stand",
      email: "produce@demo.local",
      role: "donor",
    },
    expiryTime: hoursFromNow(8),
  } as Donation,
  {
    _id: `${DEMO_LISTING_PREFIX}6`,
    foodItem: "Paneer tikka & sides",
    quantity: "40 portions",
    pickupLocation: "Spice Route Restaurant, MG Road",
    pickupTime: hoursFromNow(3),
    createdAt: new Date(Date.now() - 3 * 60 * 60000),
    status: "completed",
    category: "Meals",
    donor: {
      _id: "demo-donor-6",
      name: "Spice Route Restaurant",
      email: "restaurant@demo.local",
      role: "donor",
    },
    claimedBy: {
      _id: "demo-vol-1",
      name: "Priya Patel",
      email: "volunteer@demo.local",
      role: "volunteer",
    },
    expiryTime: hoursFromNow(1),
  } as Donation,
].map((d) => normalizeDonation(d as Donation & Record<string, unknown>));
