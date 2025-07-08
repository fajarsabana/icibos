import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ✅ Supabase Credentials
const SUPABASE_URL = "https://jqueqchgsazhompvfifr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWVxY2hnc2F6aG9tcHZmaWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDk3MzkwMiwiZXhwIjoyMDU2NTQ5OTAyfQ.7ZjSzjdlpRNObS78AU3oUZPaEzKZRUXD0hU0dUYlsx4"; // Replace with your actual key

// ✅ Initialize Supabase client
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Function to fetch location data using `rpc()`
export async function fetchLocations() {
    let { data, error } = await supabaseClient.rpc("get_wilus_mapping_duplicate");

    if (error) {
        console.error("Error fetching data:", error);
        return [];
    }

    return data;
}
