// Supabase bağlantısı (PUBLIC key – güvenli)
const SUPABASE_URL = "https://iecxlcysxtyenzfeukoo.supabase.co";
const SUPABASE_KEY = "sb_publishable_mFkD5RMG5kKq-Fy7S7j7rg_1jDayPqx";

// Global Supabase client
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
