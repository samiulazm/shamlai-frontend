// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';
import { TextEncoder, TextDecoder } from 'util';
import { MessageChannel } from 'worker_threads';
import { performance } from 'perf_hooks';
const { setImmediate, clearImmediate } = require('timers');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream;
}

if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream;
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream;
}

if (typeof global.MessageChannel === 'undefined') {
  global.MessageChannel = MessageChannel;
}

if (typeof global.MessagePort === 'undefined') {
  const { port1 } = new MessageChannel();
  global.MessagePort = port1.constructor;
}

if (typeof global.MessageEvent === 'undefined') {
  global.MessageEvent = class MessageEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.data = options.data;
    }
  };
}

if (typeof global.performance === 'undefined') {
  global.performance = performance;
}

if (typeof global.performance.markResourceTiming !== 'function') {
  global.performance.markResourceTiming = () => {};
}

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = setImmediate;
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = clearImmediate;
}

const { Blob, File, FormData, Headers, Request, Response, fetch } = require('undici');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock environment variables
process.env.NEXT_PUBLIC_INSFORGE_URL = 'https://test.insforge.app';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_NAME = 'Shamlai';

// Polyfill Web Fetch APIs for Node test environment
if (typeof global.Request === 'undefined') {
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
  global.FormData = FormData;
  global.Blob = Blob;
  global.File = File;
}

if (typeof global.fetch === 'undefined') {
  global.fetch = fetch;
}

// stream/web polyfills already assigned above
