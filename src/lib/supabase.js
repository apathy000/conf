import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://slehmlwqdcygdbsdcrjr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9FxjJDB1lH7YTjlWUppBHQ_thYYrdy8"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);