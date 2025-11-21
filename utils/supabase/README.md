# Supabase SSR Utilities

This directory contains Supabase client utilities following the recommended Next.js App Router SSR pattern using `@supabase/ssr`.

## 📁 Files

- **`server.ts`** - Server Components client (for use in Server Components)
- **`client.ts`** - Client Components client (for use in Client Components)
- **`middleware.ts`** - Middleware client (for use in Next.js middleware)

## 🚀 Usage

### Server Components

```typescript
import { createClient } from '@/utils/supabase/server';

export default async function ServerComponent() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('todos')
    .select();

  return <ul>{data?.map(todo => <li>{todo.title}</li>)}</ul>;
}
```

### Client Components

```typescript
'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [todos, setTodos] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchTodos = async () => {
      const { data } = await supabase
        .from('todos')
        .select();
      setTodos(data || []);
    };

    fetchTodos();
  }, []);

  return <ul>{todos.map(todo => <li>{todo.title}</li>)}</ul>;
}
```

### API Routes

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.from('todos').select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### Middleware

The middleware client is already integrated in `middleware.ts`. It automatically refreshes user sessions.

## 🔄 Migration from `lib/supabase.ts`

**Old pattern (still works for backwards compatibility):**

```typescript
import { supabaseClient } from '@/lib/supabase';

// Client component
const { data } = await supabaseClient.from('todos').select();
```

**New pattern (recommended for SSR):**

```typescript
// Server Component
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();
const { data } = await supabase.from('todos').select();

// Client Component
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
const { data } = await supabase.from('todos').select();
```

## ✅ Benefits

1. **Automatic Session Management** - Sessions are automatically refreshed in middleware
2. **SSR Support** - Works correctly with Next.js Server Components
3. **Cookie Handling** - Properly handles cookies for authentication
4. **Type Safety** - Full TypeScript support
5. **Best Practices** - Follows Supabase's recommended patterns

## 📝 Notes

- The old `lib/supabase.ts` exports are still available for backwards compatibility
- New code should use the SSR utilities for better session management
- Server Components must use `await createClient()` (async)
- Client Components can use `createClient()` (sync)
