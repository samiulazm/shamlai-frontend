-- Update Cart RLS to use Header-based Session ID
-- ------------------------------------------------
-- This replaces the reliance on 'app.session_id' (which requires set_config)
-- with 'x-session-id' header (which can be sent by the client directly).

BEGIN;

-- 1. Cart Policy
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
CREATE POLICY "Users can manage own cart" ON public.cart
    FOR ALL USING (
        user_id = auth.uid() 
        OR 
        session_id = (current_setting('request.headers', true)::json->>'x-session-id')
    );

-- 2. Cart Items Policy
DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items
    FOR ALL USING (
        cart_id IN (
            SELECT id FROM cart 
            WHERE user_id = auth.uid() 
            OR 
            session_id = (current_setting('request.headers', true)::json->>'x-session-id')
        )
    );

COMMIT;
