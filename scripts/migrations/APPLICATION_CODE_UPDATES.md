# Application Code Updates Required After Database Migrations

This guide shows the application code changes needed after running the database fix migrations.

## Overview

After running migrations 009-013, you need to update your application code to:

1. Use the new `sessions` table
2. Handle session UUID references instead of strings
3. Implement guest cart merging on login
4. Use typed references for inventory logs and HRM activities
5. Handle nullable foreign keys properly
6. Use cart validation functions before checkout

---

## 1. Session Management Updates

### Before Migration

```typescript
// Old approach - storing session_id as string
const sessionId = req.cookies.session_id || generateSessionId();

await db.query(`
  INSERT INTO cart (session_id, product_id, quantity, shop_id)
  VALUES ($1, $2, $3, $4)
`, [sessionId, productId, quantity, shopId]);
```

### After Migration

```typescript
// New approach - using sessions table
import { v4 as uuidv4 } from 'uuid';

// Create or get session
async function getOrCreateSession(req: Request, res: Response) {
  let sessionToken = req.cookies.session_token;
  let sessionId: string;

  if (!sessionToken) {
    // Create new session
    sessionToken = generateSessionToken(); // Random string
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const result = await db.query(`
      INSERT INTO sessions (session_token, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [sessionToken, expiresAt, req.ip, req.headers['user-agent']]);

    sessionId = result.rows[0].id;

    // Set cookie
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax'
    });
  } else {
    // Get existing session
    const result = await db.query(`
      SELECT id FROM sessions WHERE session_token = $1 AND expires_at > NOW()
    `, [sessionToken]);

    if (result.rows.length === 0) {
      // Session expired, create new one
      return getOrCreateSession(req, res);
    }

    sessionId = result.rows[0].id;

    // Update last activity
    await db.query(`
      UPDATE sessions SET last_activity = NOW() WHERE id = $1
    `, [sessionId]);
  }

  return { sessionId, sessionToken };
}

// Use in cart operations
app.post('/api/cart/add', async (req, res) => {
  const { sessionId } = await getOrCreateSession(req, res);
  const { productId, variantId, quantity, shopId } = req.body;

  await db.query(`
    INSERT INTO cart (session_uuid, product_id, variant_id, quantity, shop_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (session_uuid, product_id, variant_id) DO UPDATE
    SET quantity = cart.quantity + $4
  `, [sessionId, productId, variantId, quantity, shopId]);

  res.json({ success: true });
});
```

---

## 2. User Login - Guest Cart Merge

### Implementation

```typescript
// On user login, merge guest cart into user cart
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Authenticate user
  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Get current session
  const sessionToken = req.cookies.session_token;

  if (sessionToken) {
    // Get session ID
    const sessionResult = await db.query(`
      SELECT id FROM sessions WHERE session_token = $1
    `, [sessionToken]);

    if (sessionResult.rows.length > 0) {
      const sessionId = sessionResult.rows[0].id;

      // Merge guest cart into user cart
      const mergeResult = await db.query(`
        SELECT * FROM merge_guest_cart_on_login($1, $2::varchar, $3)
      `, [user.id, sessionToken, user.shop_id]);

      const { items_merged, items_updated, items_added } = mergeResult.rows[0];

      console.log(`Cart merge: ${items_merged} items merged, ${items_updated} updated, ${items_added} added`);

      // Update session with user_id
      await db.query(`
        UPDATE sessions SET user_id = $1 WHERE id = $2
      `, [user.id, sessionId]);
    }
  }

  // Create JWT token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

  res.json({
    success: true,
    token,
    user,
    cartMerged: true
  });
});
```

---

## 3. Cart Validation Before Checkout

### Implementation

```typescript
app.post('/api/checkout', async (req, res) => {
  const userId = req.user.id; // From authentication middleware

  // Validate cart before checkout
  const validation = await db.query(`
    SELECT * FROM validate_user_cart($1, NULL)
  `, [userId]);

  const unavailableItems = validation.rows.filter(item => !item.is_available);

  if (unavailableItems.length > 0) {
    return res.status(400).json({
      error: 'Some items are unavailable',
      unavailableItems: unavailableItems.map(item => ({
        productName: item.product_name,
        variantName: item.variant_name,
        message: item.message,
        requestedQuantity: item.requested_quantity,
        availableQuantity: item.available_quantity
      }))
    });
  }

  // Get cart summary
  const summary = await db.query(`
    SELECT * FROM get_cart_summary($1, NULL, NULL)
  `, [userId]);

  const {
    total_items,
    total_quantity,
    subtotal,
    available_items,
    unavailable_items
  } = summary.rows[0];

  // Proceed with checkout
  // ... create order logic
});
```

---

## 4. Inventory Logs - Typed References

### Before Migration

```typescript
// Old approach - generic reference_id
await db.query(`
  INSERT INTO inventory_logs (product_id, change_quantity, reference_id, notes)
  VALUES ($1, $2, $3, $4)
`, [productId, -quantity, orderId, 'Order placed']);
```

### After Migration

```typescript
// New approach - typed references
async function logInventoryChange(
  productId: string,
  variantId: string | null,
  changeQuantity: number,
  referenceType: 'order' | 'product' | 'variant' | 'adjustment' | 'return' | 'damage' | 'transfer',
  referenceId: string | null,
  notes: string,
  shopId: string
) {
  const referenceColumn = referenceType === 'order' ? 'order_reference_id' :
                          referenceType === 'product' ? 'product_reference_id' :
                          referenceType === 'variant' ? 'variant_reference_id' :
                          null;

  if (referenceColumn) {
    await db.query(`
      INSERT INTO inventory_logs (
        product_id, variant_id, change_quantity, reference_type,
        ${referenceColumn}, notes, shop_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [productId, variantId, changeQuantity, referenceType, referenceId, notes, shopId]);
  } else {
    await db.query(`
      INSERT INTO inventory_logs (
        product_id, variant_id, change_quantity, reference_type, notes, shop_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [productId, variantId, changeQuantity, referenceType, notes, shopId]);
  }
}

// Usage examples
await logInventoryChange(
  productId,
  variantId,
  -5,
  'order',
  orderId,
  'Order placed - 5 units sold',
  shopId
);

await logInventoryChange(
  productId,
  null,
  100,
  'adjustment',
  null,
  'Stock replenishment',
  shopId
);
```

---

## 5. HRM Activities - Typed References

### After Migration

```typescript
async function createHRMActivity(
  employeeId: string,
  activityType: string,
  referenceType: 'leave' | 'attendance' | 'task' | 'employee' | 'other',
  referenceId: string | null,
  description: string,
  shopId: string
) {
  const referenceColumn = referenceType === 'leave' ? 'leave_reference_id' :
                          referenceType === 'attendance' ? 'attendance_reference_id' :
                          referenceType === 'task' ? 'task_reference_id' :
                          referenceType === 'employee' ? 'employee_reference_id' :
                          null;

  if (referenceColumn) {
    await db.query(`
      INSERT INTO hrm_activities (
        employee_id, activity_type, reference_type, ${referenceColumn},
        description, shop_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [employeeId, activityType, referenceType, referenceId, description, shopId]);
  } else {
    await db.query(`
      INSERT INTO hrm_activities (
        employee_id, activity_type, reference_type, description, shop_id
      )
      VALUES ($1, $2, $3, $4, $5)
    `, [employeeId, activityType, referenceType, description, shopId]);
  }
}

// Usage
await createHRMActivity(
  employeeId,
  'Leave Approved',
  'leave',
  leaveId,
  'Annual leave approved for 3 days',
  shopId
);
```

---

## 6. Handling Nullable Foreign Keys

### Order Items

```typescript
// When displaying order history
app.get('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;

  const result = await db.query(`
    SELECT
      oi.*,
      COALESCE(p.name, oi.product_name) as product_name,
      COALESCE(pv.name, oi.variant_name) as variant_name,
      CASE
        WHEN oi.product_id IS NULL THEN true
        ELSE false
      END as product_deleted
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_variants pv ON oi.variant_id = pv.id
    WHERE oi.order_id = $1
  `, [orderId]);

  const items = result.rows.map(item => ({
    ...item,
    // Always use denormalized data for historical accuracy
    displayName: item.product_name,
    variantName: item.variant_name,
    price: item.price,
    isProductDeleted: item.product_deleted
  }));

  res.json({ items });
});
```

### Product Reviews

```typescript
// When displaying reviews
app.get('/api/products/:productId/reviews', async (req, res) => {
  const { productId } = req.params;

  const result = await db.query(`
    SELECT
      pr.*,
      c.first_name,
      c.last_name,
      o.order_number,
      CASE
        WHEN pr.order_id IS NULL THEN 'N/A'
        ELSE o.order_number
      END as order_reference
    FROM product_reviews pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    LEFT JOIN orders o ON pr.order_id = o.id
    WHERE pr.product_id = $1
    AND pr.is_active = true
    ORDER BY pr.created_at DESC
  `, [productId]);

  res.json({ reviews: result.rows });
});
```

---

## 7. Scheduled Cart Cleanup

### Node.js Cron Job

```typescript
import cron from 'node-cron';
import { db } from './db';

// Run cleanup daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled cart cleanup...');

  try {
    const result = await db.query('SELECT * FROM scheduled_cart_cleanup()');
    const {
      abandoned_carts_removed,
      empty_carts_removed,
      expired_sessions_removed
    } = result.rows[0];

    console.log(`Cleanup complete:
      - Abandoned carts: ${abandoned_carts_removed}
      - Empty carts: ${empty_carts_removed}
      - Expired sessions: ${expired_sessions_removed}
    `);
  } catch (error) {
    console.error('Cart cleanup failed:', error);
  }
});
```

### Alternative: Postgres Cron Extension

```sql
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 2 AM
SELECT cron.schedule('cart-cleanup', '0 2 * * *', $$
  SELECT * FROM scheduled_cart_cleanup();
$$);
```

---

## 8. Email Validation on User Registration

### Before Migration

```typescript
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Create user
  const result = await db.query(`
    INSERT INTO users (email, password_hash, name)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [email, hashedPassword, name]);

  res.json({ success: true, userId: result.rows[0].id });
});
```

### After Migration (with UNIQUE constraint)

```typescript
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Validate email format
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const result = await db.query(`
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [email.toLowerCase(), hashedPassword, name]);

    res.json({ success: true, userId: result.rows[0].id });

  } catch (error) {
    // Handle duplicate email (UNIQUE constraint violation)
    if (error.code === '23505' && error.constraint === 'unique_users_email') {
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Handle other errors
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

---

## 9. Cart Display with Validation

### Frontend Implementation

```typescript
// Fetch cart with validation
async function fetchCart() {
  const response = await fetch('/api/cart');
  const data = await response.json();

  return {
    items: data.items,
    summary: data.summary,
    unavailableItems: data.items.filter(item => !item.is_available)
  };
}

// Display cart component
function CartComponent() {
  const [cart, setCart] = useState(null);

  useEffect(() => {
    fetchCart().then(setCart);
  }, []);

  if (!cart) return <div>Loading...</div>;

  return (
    <div>
      <h2>Shopping Cart</h2>

      {cart.unavailableItems.length > 0 && (
        <div className="alert alert-warning">
          <p>Some items in your cart are no longer available:</p>
          <ul>
            {cart.unavailableItems.map(item => (
              <li key={item.cart_id}>
                {item.product_name} - {item.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="cart-items">
        {cart.items.map(item => (
          <CartItem
            key={item.cart_id}
            item={item}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <div className="cart-summary">
        <p>Total Items: {cart.summary.total_items}</p>
        <p>Subtotal: ${cart.summary.subtotal}</p>

        <button
          onClick={handleCheckout}
          disabled={cart.unavailableItems.length > 0}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
```

### Backend API

```typescript
app.get('/api/cart', async (req, res) => {
  const userId = req.user?.id;
  const { sessionId } = await getOrCreateSession(req, res);

  // Get cart items with validation
  const validation = await db.query(`
    SELECT * FROM validate_user_cart($1, $2)
  `, [userId, userId ? null : sessionId]);

  // Get cart summary
  const summary = await db.query(`
    SELECT * FROM get_cart_summary($1, $2, NULL)
  `, [userId, userId ? null : sessionId]);

  res.json({
    items: validation.rows,
    summary: summary.rows[0]
  });
});
```

---

## 10. TypeScript Type Updates

### Generate Updated Types

```typescript
// Example using pg-typegen or similar tools
// Run: npm run generate:types

// Updated types will include:

interface Session {
  id: string; // UUID
  user_id: string | null;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: Date;
  expires_at: Date;
  last_activity: Date;
  is_active: boolean;
  metadata: Record<string, any>;
}

interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null; // Deprecated, use session_uuid
  session_uuid: string | null; // New FK to sessions
  product_id: string;
  variant_id: string | null;
  quantity: number;
  shop_id: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

interface InventoryLog {
  id: string;
  product_id: string;
  variant_id: string | null;
  change_quantity: number;
  reference_id: string | null; // Deprecated
  reference_type: 'order' | 'product' | 'variant' | 'adjustment' | 'return' | 'damage' | 'transfer' | null;
  order_reference_id: string | null; // New typed FK
  product_reference_id: string | null; // New typed FK
  variant_reference_id: string | null; // New typed FK
  notes: string | null;
  shop_id: string;
  created_at: Date;
}
```

---

## Summary Checklist

After running migrations, update your application code:

- [ ] Implement session management with `sessions` table
- [ ] Add guest cart merge on user login
- [ ] Use `session_uuid` instead of `session_id` for new code
- [ ] Implement cart validation before checkout
- [ ] Update inventory log creation to use typed references
- [ ] Update HRM activity creation to use typed references
- [ ] Handle nullable FKs in order items, reviews, etc.
- [ ] Add email validation and duplicate handling in registration
- [ ] Set up scheduled cart cleanup cron job
- [ ] Regenerate TypeScript types from updated schema
- [ ] Update frontend to display unavailable cart items
- [ ] Test all cart flows (guest → login → checkout)
- [ ] Update documentation for developers

---

## Testing Recommendations

1. **Session Management**
   - Test guest user creating cart
   - Test logged-in user creating cart
   - Test session expiration
   - Test session cleanup

2. **Cart Merging**
   - Add items as guest
   - Log in
   - Verify guest cart merged into user cart
   - Verify quantities added correctly for duplicate items

3. **Cart Validation**
   - Add items to cart
   - Delete/deactivate product
   - View cart (should show unavailable)
   - Try checkout (should fail with message)

4. **Duplicate Prevention**
   - Try registering with existing email (should fail)
   - Try creating duplicate customer in same shop (should fail)

5. **Historical Data Preservation**
   - Create order with reviews
   - Delete order
   - Verify reviews still exist
   - Verify order items still exist with denormalized data

---

This completes the application code updates needed after running the database migrations!
