export interface Url {
  id: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  _count: { clicks: number };
}
