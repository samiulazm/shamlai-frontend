'use strict';
const __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    let _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * @jest-environment node
 */
const globals_1 = require('@jest/globals');
const courier_1 = require('@/lib/services/courier');
// Mock fetch
const mockFetch = globals_1.jest.fn();
global.fetch = mockFetch;
(0, globals_1.describe)('Courier Service', function () {
  (0, globals_1.beforeEach)(function () {
    // Clear all mocks
    mockFetch.mockClear();
    mockFetch.mockReset();
    if (courier_1.__resetCourierTestState) {
      (0, courier_1.__resetCourierTestState)();
    }
    // Set environment variables
    process.env.PATHAO_CLIENT_ID = 'test_client_id';
    process.env.PATHAO_CLIENT_SECRET = 'test_client_secret';
    process.env.PATHAO_STORE_ID = 'test_store_id';
    process.env.REDX_API_KEY = 'test_api_key';
  });
  const mockShipmentParams = {
    orderNumber: 'ORD-12345',
    customerName: 'John Doe',
    customerPhone: '+8801234567890',
    customerAddress: {
      street: '123 Main St',
      city: 'Dhaka',
      state: 'Dhaka',
      zip: '1000',
      country: 'BD',
    },
    items: [{ name: 'Product 1', quantity: 2, price: 1000 }],
    totalAmount: 2000,
    weight: 1,
  };
  (0, globals_1.describe)('Pathao Integration', function () {
    (0, globals_1.it)('should create Pathao shipment successfully', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Mock token request
              mockFetch
                .mockResolvedValueOnce({
                  ok: true,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [2 /*return*/, { access_token: 'test_token', expires_in: 3600 }];
                      });
                    });
                  },
                })
                // Mock shipment creation
                .mockResolvedValueOnce({
                  ok: true,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [
                          2 /*return*/,
                          {
                            type: 'success',
                            data: { consignment_id: 'PATH123', invoice_id: 'INV123' },
                          },
                        ];
                      });
                    });
                  },
                });
              return [4 /*yield*/, (0, courier_1.createPathaoShipment)(mockShipmentParams)];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(true);
              (0, globals_1.expect)(result.trackingNumber).toBe('PATH123');
              (0, globals_1.expect)(result.consignmentId).toBe('PATH123');
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)('should handle Pathao API errors', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockFetch
                .mockResolvedValueOnce({
                  ok: true,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [2 /*return*/, { access_token: 'test_token', expires_in: 3600 }];
                      });
                    });
                  },
                })
                .mockResolvedValueOnce({
                  ok: false,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [2 /*return*/, { type: 'error', message: 'Invalid address' }];
                      });
                    });
                  },
                });
              return [4 /*yield*/, (0, courier_1.createPathaoShipment)(mockShipmentParams)];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(false);
              (0, globals_1.expect)(result.error).toBeDefined();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)('RedX Integration', function () {
    (0, globals_1.it)('should create RedX shipment successfully', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: function () {
                  return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                      return [
                        2 /*return*/,
                        {
                          success: true,
                          tracking_id: 'REDX123',
                        },
                      ];
                    });
                  });
                },
              });
              return [4 /*yield*/, (0, courier_1.createRedXShipment)(mockShipmentParams)];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(true);
              (0, globals_1.expect)(result.trackingNumber).toBe('REDX123');
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)('should handle RedX API errors', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockFetch.mockResolvedValueOnce({
                ok: false,
                json: function () {
                  return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                      return [2 /*return*/, { success: false, message: 'API error' }];
                    });
                  });
                },
              });
              return [4 /*yield*/, (0, courier_1.createRedXShipment)(mockShipmentParams)];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(false);
              (0, globals_1.expect)(result.error).toBeDefined();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)('Generic Interface', function () {
    (0, globals_1.it)('should route to correct courier service', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockFetch
                .mockResolvedValueOnce({
                  ok: true,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [2 /*return*/, { access_token: 'test_token', expires_in: 3600 }];
                      });
                    });
                  },
                })
                .mockResolvedValueOnce({
                  ok: true,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [
                          2 /*return*/,
                          {
                            type: 'success',
                            data: { consignment_id: 'PATH123', invoice_id: 'INV123' },
                          },
                        ];
                      });
                    });
                  },
                });
              return [4 /*yield*/, (0, courier_1.createShipment)('pathao', mockShipmentParams)];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(true);
              (0, globals_1.expect)(result.trackingNumber).toBe('PATH123');
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)('should handle invalid courier type', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, (0, courier_1.createShipment)('invalid', mockShipmentParams)];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(false);
              (0, globals_1.expect)(result.error).toBe('Invalid courier type');
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)('Tracking', function () {
    (0, globals_1.it)('should track Pathao shipment', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockFetch
                .mockResolvedValueOnce({
                  ok: true,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [2 /*return*/, { access_token: 'test_token', expires_in: 3600 }];
                      });
                    });
                  },
                })
                .mockResolvedValueOnce({
                  ok: true,
                  json: function () {
                    return __awaiter(void 0, void 0, void 0, function () {
                      return __generator(this, function (_a) {
                        return [
                          2 /*return*/,
                          {
                            data: {
                              order_status: 'delivered',
                              order_logs: [
                                { status: 'delivered', timestamp: '2025-01-13T10:00:00Z' },
                              ],
                            },
                          },
                        ];
                      });
                    });
                  },
                });
              return [4 /*yield*/, (0, courier_1.trackShipment)('pathao', 'PATH123')];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(true);
              (0, globals_1.expect)(result.status).toBe('delivered');
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)('should track RedX shipment', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        let result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: function () {
                  return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                      return [
                        2 /*return*/,
                        {
                          success: true,
                          current_status: 'in_transit',
                          tracking_history: [],
                        },
                      ];
                    });
                  });
                },
              });
              return [4 /*yield*/, (0, courier_1.trackShipment)('redx', 'REDX123')];
            case 1:
              result = _a.sent();
              (0, globals_1.expect)(result.success).toBe(true);
              (0, globals_1.expect)(result.status).toBe('in_transit');
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
