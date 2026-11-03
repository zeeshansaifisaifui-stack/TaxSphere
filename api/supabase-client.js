const { createClient } = require('@supabase/supabase-js');

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[Supabase] Initializing client with hostname:', supabaseUrl ? new URL(supabaseUrl).hostname : 'MISSING');
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is missing');
  }
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  
  // Ensure URL is base URL without path
  let cleanUrl = supabaseUrl.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  if (cleanUrl.includes('/rest/v1') || cleanUrl.includes('/auth/v1') || cleanUrl.includes('/storage/v1')) {
    cleanUrl = cleanUrl.split('/rest/v1')[0].split('/auth/v1')[0].split('/storage/v1')[0];
  }
  
  const supabase = createClient(cleanUrl, supabaseServiceKey);
  return supabase;
}

module.exports = { createSupabaseClient, supabase: createSupabaseClient() };
