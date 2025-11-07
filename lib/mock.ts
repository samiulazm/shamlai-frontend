export type Product = {
  id: string;
  title: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  images: string[];
  status: "active" | "draft";
};

export type Order = {
  id: string;
  date: string;
  customer: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  orders: number;
  spend: number;
};

export const products: Product[] = [
  { id: "p1", title: "Dhaka Heritage Tee", price: 1490, stock: 32, sku: "ET-001", category: "Streetwear", images: ["/placeholder.svg"], status: "active" },
  { id: "p2", title: "Megh Boleche Tee", price: 1390, stock: 18, sku: "AT-002", category: "Music", images: ["/placeholder.svg"], status: "active" },
  { id: "p3", title: "Golpo Tee", price: 1290, stock: 0, sku: "AT-003", category: "Typography", images: ["/placeholder.svg"], status: "draft" }
];

export const orders: Order[] = [
  { id: "O-10021", date: "2025-10-10", customer: "Tasnova", total: 2780, status: "processing" },
  { id: "O-10022", date: "2025-10-11", customer: "Shatabdi", total: 1390, status: "pending" },
  { id: "O-10023", date: "2025-10-12", customer: "Nodi", total: 1490, status: "shipped" }
];

export const customers: Customer[] = [
  { id: "c1", name: "Tasnova", email: "tasnova@example.com", orders: 3, spend: 5270 },
  { id: "c2", name: "Shatabdi", email: "shatabdi@example.com", orders: 1, spend: 1390 },
  { id: "c3", name: "Nodi", email: "nodi@example.com", orders: 2, spend: 2980 }
];

export const categories = ["Streetwear", "Music", "Typography", "Festival"];
