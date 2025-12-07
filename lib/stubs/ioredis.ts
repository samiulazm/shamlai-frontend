/**
 * Empty stub for ioredis on client-side
 *
 * This module is substituted for ioredis in client bundles via webpack alias.
 * It exports a minimal interface that won't break imports but does nothing.
 */

// Export a fake Redis class that does nothing
export class Redis {
  constructor() {
    console.warn('Redis is not available on the client side');
  }
  get() {
    return Promise.resolve(null);
  }
  set() {
    return Promise.resolve('OK');
  }
  del() {
    return Promise.resolve(0);
  }
  expire() {
    return Promise.resolve(0);
  }
  on() {
    return this;
  }
  connect() {
    return Promise.resolve();
  }
  disconnect() {
    return Promise.resolve();
  }
  quit() {
    return Promise.resolve('OK');
  }
}

export default Redis;
