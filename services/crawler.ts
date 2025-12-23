import { CATEGORIES } from "../data";
import { generateProductsForCategory } from "./geminiService";
import { db } from "./db";
import { Product } from "../types";

export type CrawlStatus = 'idle' | 'initializing' | 'crawling' | 'complete' | 'error';

interface CrawlerState {
  status: CrawlStatus;
  progress: number; // 0 to 100
  currentTask: string;
  totalProductsFound: number;
}

type Subscriber = (state: CrawlerState) => void;

class CrawlerService {
  private state: CrawlerState = {
    status: 'idle',
    progress: 0,
    currentTask: '',
    totalProductsFound: 0
  };
  
  private subscribers: Subscriber[] = [];
  private isRunning = false;

  subscribe(callback: Subscriber) {
    this.subscribers.push(callback);
    callback(this.state); // Initial emission
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  async initializeSystem() {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. Check if DB needs update or is empty
    const needsUpdate = db.needsUpdate();
    const currentData = db.load();

    if (!currentData || currentData.length === 0) {
      // FIRST RUN: Full initialization required
      await this.performFullCrawl();
    } else if (needsUpdate) {
      // STALE DATA: Background update
      // We don't block the UI here, just trigger crawl
      console.log("[Crawler] DB is stale. Starting background update...");
      this.performFullCrawl(true); // true = background mode
    } else {
      console.log("[Crawler] DB is up to date.");
      this.state.status = 'complete';
      this.state.progress = 100;
      this.state.totalProductsFound = currentData.length;
      this.notify();
    }

    this.isRunning = false;
  }

  private async performFullCrawl(isBackground: boolean = false) {
    this.state.status = 'crawling';
    this.state.totalProductsFound = db.load()?.length || 0;
    this.notify();

    // Flatten all categories and subcategories into a task list
    const tasks: { cat: string; sub: string }[] = [];
    CATEGORIES.forEach(c => {
      c.subCategories.forEach(s => {
        tasks.push({ cat: c.name, sub: s });
      });
    });

    const totalTasks = tasks.length;
    let completedTasks = 0;

    // Process tasks in chunks to avoid overwhelming the browser/API limits
    // We'll do 2 requests in parallel
    const BATCH_SIZE = 2;
    
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (task) => {
        if (!isBackground) {
           this.state.currentTask = `Scanning ${task.cat} > ${task.sub}...`;
           this.notify();
        }

        // Fetch products
        // Ask for around 5-8 products per subcategory to build the "top 50" overall per category
        const newProducts = await generateProductsForCategory(task.cat, task.sub, 6);
        
        if (newProducts.length > 0) {
          db.merge(newProducts);
          this.state.totalProductsFound = (db.load()?.length || 0);
        }
      });

      await Promise.all(promises);
      
      completedTasks += batch.length;
      this.state.progress = Math.round((completedTasks / totalTasks) * 100);
      this.notify();
    }

    this.state.status = 'complete';
    this.state.currentTask = 'Database Updated';
    this.notify();
  }
}

export const crawler = new CrawlerService();
