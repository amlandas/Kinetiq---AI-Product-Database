import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../src/data';

type SnapshotProduct = {
  id: string;
  growthRate: number;
  lastUpdate: string;
};

type AnalyticsSnapshot = {
  date: string;
  products: SnapshotProduct[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_PATH = path.resolve(__dirname, '../src/data/analyticsSnapshots.json');

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const captureSnapshot = (): AnalyticsSnapshot => {
  const date = toIsoDate(new Date());
  const products: SnapshotProduct[] = PRODUCTS.map((product) => ({
    id: product.id,
    growthRate: Number(product.metrics.growthRate) || 0,
    lastUpdate: product.lastUpdate,
  }));

  return { date, products };
};

const loadSnapshots = (): AnalyticsSnapshot[] => {
  if (!fs.existsSync(SNAPSHOT_PATH)) return [];
  const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
  if (!raw.trim()) return [];
  try {
    return JSON.parse(raw) as AnalyticsSnapshot[];
  } catch (error) {
    console.error('Failed to parse analyticsSnapshots.json. Aborting.');
    throw error;
  }
};

const saveSnapshots = (snapshots: AnalyticsSnapshot[]) => {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
};

const upsertSnapshot = (snapshots: AnalyticsSnapshot[], next: AnalyticsSnapshot) => {
  const existingIndex = snapshots.findIndex((snapshot) => snapshot.date === next.date);
  if (existingIndex >= 0) {
    snapshots[existingIndex] = next;
  } else {
    snapshots.push(next);
  }

  const MAX_WEEKS = 52;
  return snapshots
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_WEEKS);
};

const run = () => {
  const snapshots = loadSnapshots();
  const snapshot = captureSnapshot();
  const updated = upsertSnapshot(snapshots, snapshot);
  saveSnapshots(updated);

  console.log(`Captured analytics snapshot for ${snapshot.date}. Total snapshots: ${updated.length}.`);
};

run();
