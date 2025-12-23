import { Product } from "../types";
import { PRODUCTS as SEED_PRODUCTS } from "../data";

const DB_KEY = 'ai_nexus_db_v1';
const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DBSnapshot {
  timestamp: number;
  products: Product[];
  version: number;
}

export const db = {
  // Load data from local storage
  load: (): Product[] | null => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return null;
      
      const snapshot: DBSnapshot = JSON.parse(raw);
      // Basic integrity check
      if (!snapshot.products || !Array.isArray(snapshot.products)) return null;
      
      console.log(`[DB] Loaded ${snapshot.products.length} products from snapshot dated ${new Date(snapshot.timestamp).toLocaleString()}`);
      return snapshot.products;
    } catch (e) {
      console.error("Failed to load DB", e);
      return null;
    }
  },

  // Save data to local storage
  save: (products: Product[]) => {
    try {
      const snapshot: DBSnapshot = {
        timestamp: Date.now(),
        products,
        version: 1
      };
      localStorage.setItem(DB_KEY, JSON.stringify(snapshot));
      console.log(`[DB] Saved ${products.length} products.`);
    } catch (e) {
      console.error("Failed to save DB (likely quota exceeded)", e);
    }
  },

  // Check if update is needed (older than 24 hours)
  needsUpdate: (): boolean => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return true; // No data means we need an update (initialization)
      
      const snapshot: DBSnapshot = JSON.parse(raw);
      const age = Date.now() - snapshot.timestamp;
      
      return age > UPDATE_INTERVAL_MS;
    } catch (e) {
      return true;
    }
  },

  // Seed with initial data if empty
  seed: (): Product[] => {
    const existing = db.load();
    if (existing && existing.length > 0) return existing;
    
    // If absolutely nothing exists, start with the hardcoded data
    db.save(SEED_PRODUCTS);
    return SEED_PRODUCTS;
  },
  
  // Merge new products into existing DB preventing duplicates
  merge: (newProducts: Product[]) => {
    const current = db.load() || [];
    const map = new Map<string, Product>();
    
    // Load current
    current.forEach(p => map.set(p.id, p));
    
    // Merge new (overwrite if ID exists, or add new)
    newProducts.forEach(p => map.set(p.id, p));
    
    const merged = Array.from(map.values());
    db.save(merged);
    return merged;
  }
};
