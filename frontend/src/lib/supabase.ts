import { createClient } from '@supabase/supabase-js';

const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || 'your-project-id';
const supabaseUrl = `https://${projectId}.supabase.co`;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'your-publishable-key';

export const supabase = createClient(supabaseUrl, publishableKey);
