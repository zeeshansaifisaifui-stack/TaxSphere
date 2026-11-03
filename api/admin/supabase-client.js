const { createClient } = require('@supabase/supabase-js');

function createSupabaseClient() {
  let supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env vars');
  }
  
  supabaseUrl = supabaseUrl.trim();
  
  while (supabaseUrl.endsWith('/')) {
    supabaseUrl = supabaseUrl.slice(0, -1);
  }
  
  if (supabaseUrl.indexOf('/rest/v1') !== -1) {
    supabaseUrl = supabaseUrl.split('/rest/v1')[0];
  }
  if (supabaseUrl.indexOf('/auth/v1') !== -1) {
    supabaseUrl = supabaseUrl.split('/auth/v1')[0];
  }
  if (supabaseUrl.indexOf('/storage/v1') !== -1) {
    supabaseUrl = supabaseUrl.split('/storage/v1')[0];
  }
  
  try {
    const urlObj = new URL(supabaseUrl);
    console.log('[SUPABASE_INIT_ADMIN] hostname=' + urlObj.hostname);
  } catch (e) {
    console.log('[SUPABASE_INIT_ADMIN] invalid url');
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return supabase;
}

const supabase = createSupabaseClient();

module.exports = { supabase, createSupabaseClient };
