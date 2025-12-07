
/**
 * RequestQueue & Rate Limiter
 * Manages concurrent execution of async tasks to prevent API rate limiting.
 */

// --- Rate Limiter Class ---
class RateLimiter {
    private lastCallTime: number = 0;
    private queue: Promise<void> = Promise.resolve();
    private minInterval: number;

    constructor(minIntervalMs: number) {
        this.minInterval = minIntervalMs;
    }

    async schedule<T>(task: () => Promise<T>): Promise<T> {
        // We chain the "start time" check, NOT the task execution itself.
        const startPermission = this.queue.then(async () => {
            const now = Date.now();
            const timeSinceLast = now - this.lastCallTime;
            
            if (timeSinceLast < this.minInterval) {
                const waitTime = this.minInterval - timeSinceLast;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            this.lastCallTime = Date.now();
        });

        // Update the queue tail so the next request waits for this permission
        this.queue = startPermission.then(() => {}).catch(() => {});
        
        // Wait for permission, THEN execute the task independently (parallel execution)
        await startPermission;
        return task();
    }
}

// --- Specific Limiters ---

// Global Limiter: Unified to ensure we don't hit project-level quotas.
// 1500ms interval = Max 40 requests per minute (Safe zone).
export const globalLimiter = new RateLimiter(1500);

// --- Task Queue (High Level) ---
// Controls how many Personas run in parallel.
// Reduced to 3 to prevent burst rate limiting.
export class RequestQueue {
  private concurrency: number;
  private running: number;
  private queue: (() => Promise<void>)[];

  constructor(concurrency: number = 3) { 
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      this.queue.push(wrappedTask);
      this.next();
    });
  }

  private next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.running++;
    
    // Execute task
    task().finally(() => {
      this.running--;
      this.next();
    });
  }
}

// Singleton instance for parallel persona processing
export const geminiQueue = new RequestQueue(3);
