-- Migration: SMS Notification System
-- Description: Add SMS notification support for order updates and customer communication
-- Date: 2025-11-16

-- Step 1: Create sms_notifications table
CREATE TABLE IF NOT EXISTS sms_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN (
    'order_confirmation',
    'order_status_update',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'payment_confirmation',
    'delivery_reminder',
    'promotional',
    'otp',
    'custom'
  )) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed', 'delivered')) DEFAULT 'pending',
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  provider_response JSONB,
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_notifications(phone);
CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_type ON sms_notifications(type);
CREATE INDEX IF NOT EXISTS idx_sms_shop ON sms_notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_sms_order ON sms_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_notifications(created_at DESC);

-- Step 2: Create SMS templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  template_en TEXT NOT NULL,
  template_bn TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shop_id, type)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_sms_templates_shop ON sms_templates(shop_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(type);

-- Step 3: Create SMS settings table
CREATE TABLE IF NOT EXISTS sms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE UNIQUE,
  provider VARCHAR(50) CHECK (provider IN ('greenweb', 'sslcommerz', 'custom')),
  api_key TEXT,
  sender_id VARCHAR(20),
  is_enabled BOOLEAN DEFAULT false,
  send_order_confirmation BOOLEAN DEFAULT true,
  send_order_shipped BOOLEAN DEFAULT true,
  send_order_delivered BOOLEAN DEFAULT true,
  send_promotional BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_sms_settings_shop ON sms_settings(shop_id);

-- Step 4: Insert default SMS templates
INSERT INTO sms_templates (name, type, template_en, template_bn, variables) VALUES
  (
    'Order Confirmation',
    'order_confirmation',
    'Thank you for your order #{orderNumber}! Total: {currency}{total}. We will notify you when it ships.',
    'আপনার অর্ডার #{orderNumber} নিশ্চিত হয়েছে! মোট: {currency}{total}। পাঠানো হলে আমরা আপনাকে জানাব।',
    '["orderNumber", "total", "currency"]'::jsonb
  ),
  (
    'Order Shipped',
    'order_shipped',
    'Good news! Your order #{orderNumber} has been shipped. Tracking: {trackingNumber}. Expected delivery: {estimatedDelivery}.',
    'শুভ সংবাদ! আপনার অর্ডার #{orderNumber} পাঠানো হয়েছে। ট্র্যাকিং: {trackingNumber}। আনুমানিক ডেলিভারি: {estimatedDelivery}।',
    '["orderNumber", "trackingNumber", "estimatedDelivery"]'::jsonb
  ),
  (
    'Order Delivered',
    'order_delivered',
    'Your order #{orderNumber} has been delivered! Thank you for shopping with us. Rate your experience: {shopUrl}',
    'আপনার অর্ডার #{orderNumber} ডেলিভার করা হয়েছে! আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ। রিভিউ দিন: {shopUrl}',
    '["orderNumber", "shopUrl"]'::jsonb
  ),
  (
    'Payment Confirmation',
    'payment_confirmation',
    'Payment of {currency}{amount} received for order #{orderNumber}. Payment method: {paymentMethod}. Thank you!',
    'অর্ডার #{orderNumber} এর জন্য {currency}{amount} পেমেন্ট প্রাপ্ত হয়েছে। পেমেন্ট পদ্ধতি: {paymentMethod}। ধন্যবাদ!',
    '["orderNumber", "amount", "currency", "paymentMethod"]'::jsonb
  ),
  (
    'OTP Verification',
    'otp',
    'Your OTP code is: {otp}. Valid for {validMinutes} minutes. Do not share this code with anyone.',
    'আপনার OTP কোড: {otp}। {validMinutes} মিনিটের জন্য বৈধ। এই কোডটি কারো সাথে শেয়ার করবেন না।',
    '["otp", "validMinutes"]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers for updated_at
CREATE TRIGGER trigger_update_sms_notifications_timestamp
BEFORE UPDATE ON sms_notifications
FOR EACH ROW
EXECUTE FUNCTION update_sms_updated_at();

CREATE TRIGGER trigger_update_sms_templates_timestamp
BEFORE UPDATE ON sms_templates
FOR EACH ROW
EXECUTE FUNCTION update_sms_updated_at();

CREATE TRIGGER trigger_update_sms_settings_timestamp
BEFORE UPDATE ON sms_settings
FOR EACH ROW
EXECUTE FUNCTION update_sms_updated_at();

-- Step 7: Create view for SMS analytics
CREATE OR REPLACE VIEW sms_analytics AS
SELECT
  shop_id,
  type,
  status,
  DATE(created_at) as date,
  COUNT(*) as message_count,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  ROUND(
    (COUNT(CASE WHEN status = 'delivered' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as delivery_rate
FROM sms_notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY shop_id, type, status, DATE(created_at)
ORDER BY date DESC, shop_id, type;

-- Add comments
COMMENT ON TABLE sms_notifications IS 'Tracks all SMS notifications sent to customers';
COMMENT ON TABLE sms_templates IS 'SMS message templates with multi-language support';
COMMENT ON TABLE sms_settings IS 'SMS service configuration per shop';
COMMENT ON VIEW sms_analytics IS 'SMS performance analytics for last 30 days';
