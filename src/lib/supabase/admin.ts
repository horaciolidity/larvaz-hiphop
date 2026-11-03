import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://tevjgrvdtkcoijimkyim.supabase.co';

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldmpncnZkdGtjb2lqaW1reWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjcwMzMwMCwiZXhwIjoyMTA4Mjc5MzAwfQ.1dV4TKnF1UcwRGy1cgdSYXVABAelg9zrCC4xxqIAl1A';

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

