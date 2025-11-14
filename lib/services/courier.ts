import { logger } from '../utils/logger';

// Courier service interfaces
export interface CourierShipmentParams {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: {
    street: string;
    city: string;
    state?: string;
    zip?: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  weight?: number; // in kg
  notes?: string;
}

export interface CourierShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  consignmentId?: string;
  invoiceId?: string;
  error?: string;
}

export interface CourierTrackingResponse {
  success: boolean;
  status?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    location?: string;
    notes?: string;
  }>;
  error?: string;
}

// ============================================================================
// Pathao Courier Integration
// ============================================================================

const PATHAO_API_URL = process.env.PATHAO_API_URL || 'https://api-hermes.pathao.com/api/v1';
const PATHAO_CLIENT_ID = process.env.PATHAO_CLIENT_ID;
const PATHAO_CLIENT_SECRET = process.env.PATHAO_CLIENT_SECRET;
const PATHAO_STORE_ID = process.env.PATHAO_STORE_ID;

let pathaoAccessToken: string | null = null;
let pathaoTokenExpiry: number | null = null;

/**
 * Get Pathao access token
 */
async function getPathaoToken(): Promise<string> {
  try {
    // Return cached token if still valid
    if (pathaoAccessToken && pathaoTokenExpiry && Date.now() < pathaoTokenExpiry) {
      return pathaoAccessToken;
    }

    if (!PATHAO_CLIENT_ID || !PATHAO_CLIENT_SECRET) {
      throw new Error('Pathao credentials not configured');
    }

    const response = await fetch(`${PATHAO_API_URL}/issue-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: PATHAO_CLIENT_ID,
        client_secret: PATHAO_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Pathao token');
    }

    const data = await response.json();
    pathaoAccessToken = data.access_token;
    pathaoTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

    return pathaoAccessToken;
  } catch (error) {
    logger.error('Pathao token error', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Create Pathao shipment
 */
export async function createPathaoShipment(
  params: CourierShipmentParams
): Promise<CourierShipmentResponse> {
  try {
    const token = await getPathaoToken();

    const payload = {
      store_id: PATHAO_STORE_ID,
      merchant_order_id: params.orderNumber,
      recipient_name: params.customerName,
      recipient_phone: params.customerPhone,
      recipient_address: `${params.customerAddress.street}, ${params.customerAddress.city}, ${params.customerAddress.zip || ''}`,
      recipient_city: params.customerAddress.city,
      recipient_zone: params.customerAddress.state || params.customerAddress.city,
      delivery_type: 48, // 48: Normal delivery
      item_type: 2, // 2: Parcel
      special_instruction: params.notes || '',
      item_quantity: params.items.reduce((sum, item) => sum + item.quantity, 0),
      item_weight: params.weight || 0.5, // Default 0.5kg
      amount_to_collect: params.totalAmount,
      item_description: params.items.map(item => `${item.name} (${item.quantity})`).join(', '),
    };

    const response = await fetch(`${PATHAO_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.type === 'error') {
      logger.error('Pathao shipment failed', new Error(data.message || 'Unknown error'));
      return {
        success: false,
        error: data.message || 'Failed to create shipment',
      };
    }

    logger.info('Pathao shipment created', {
      orderNumber: params.orderNumber,
      consignmentId: data.data.consignment_id,
    });

    return {
      success: true,
      trackingNumber: data.data.consignment_id,
      consignmentId: data.data.consignment_id,
      invoiceId: data.data.invoice_id,
    };
  } catch (error) {
    logger.error('Pathao shipment error', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create shipment',
    };
  }
}

/**
 * Track Pathao shipment
 */
export async function trackPathaoShipment(consignmentId: string): Promise<CourierTrackingResponse> {
  try {
    const token = await getPathaoToken();

    const response = await fetch(`${PATHAO_API_URL}/orders/${consignmentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to track shipment',
      };
    }

    return {
      success: true,
      status: data.data.order_status,
      statusHistory: data.data.order_logs || [],
    };
  } catch (error) {
    logger.error('Pathao tracking error', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to track shipment',
    };
  }
}

// ============================================================================
// RedX Courier Integration
// ============================================================================

const REDX_API_URL = process.env.REDX_API_URL || 'https://openapi.redx.com.bd/v1.0.0-beta';
const REDX_API_KEY = process.env.REDX_API_KEY;

/**
 * Create RedX shipment
 */
export async function createRedXShipment(
  params: CourierShipmentParams
): Promise<CourierShipmentResponse> {
  try {
    if (!REDX_API_KEY) {
      throw new Error('RedX API key not configured');
    }

    const payload = {
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      delivery_area: params.customerAddress.city,
      delivery_area_id: null, // Auto-detect
      customer_address: `${params.customerAddress.street}, ${params.customerAddress.city}, ${params.customerAddress.zip || ''}`,
      merchant_invoice_id: params.orderNumber,
      cash_collection_amount: params.totalAmount,
      parcel_weight: params.weight || 500, // in grams
      instruction: params.notes || '',
      value: params.totalAmount,
    };

    const response = await fetch(`${REDX_API_URL}/parcel`, {
      method: 'POST',
      headers: {
        'API-ACCESS-TOKEN': REDX_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      logger.error('RedX shipment failed', new Error(data.message || 'Unknown error'));
      return {
        success: false,
        error: data.message || 'Failed to create shipment',
      };
    }

    logger.info('RedX shipment created', {
      orderNumber: params.orderNumber,
      trackingId: data.tracking_id,
    });

    return {
      success: true,
      trackingNumber: data.tracking_id,
      consignmentId: data.tracking_id,
    };
  } catch (error) {
    logger.error('RedX shipment error', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create shipment',
    };
  }
}

/**
 * Track RedX shipment
 */
export async function trackRedXShipment(trackingId: string): Promise<CourierTrackingResponse> {
  try {
    if (!REDX_API_KEY) {
      throw new Error('RedX API key not configured');
    }

    const response = await fetch(`${REDX_API_URL}/parcel/track/${trackingId}`, {
      headers: {
        'API-ACCESS-TOKEN': REDX_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: 'Failed to track shipment',
      };
    }

    return {
      success: true,
      status: data.current_status,
      statusHistory: data.tracking_history || [],
    };
  } catch (error) {
    logger.error('RedX tracking error', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to track shipment',
    };
  }
}

// ============================================================================
// Generic Courier Interface
// ============================================================================

export type CourierType = 'pathao' | 'redx';

/**
 * Create shipment with specified courier
 */
export async function createShipment(
  courier: CourierType,
  params: CourierShipmentParams
): Promise<CourierShipmentResponse> {
  switch (courier) {
    case 'pathao':
      return createPathaoShipment(params);
    case 'redx':
      return createRedXShipment(params);
    default:
      return {
        success: false,
        error: 'Invalid courier type',
      };
  }
}

/**
 * Track shipment with specified courier
 */
export async function trackShipment(
  courier: CourierType,
  trackingNumber: string
): Promise<CourierTrackingResponse> {
  switch (courier) {
    case 'pathao':
      return trackPathaoShipment(trackingNumber);
    case 'redx':
      return trackRedXShipment(trackingNumber);
    default:
      return {
        success: false,
        error: 'Invalid courier type',
      };
  }
}
