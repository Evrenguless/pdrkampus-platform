
    // ==========================================
    // 🔑 SUPABASE BULUT AYARLARI
    // ==========================================
    const SUPABASE_CONFIG = {
      URL: "https://kausxairsoyjqyvlrgsl.supabase.co",
      ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXN4YWlyc295anF5dmxyZ3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTE0NDMsImV4cCI6MjEwMzc2NzQ0M30.UsiSiw-QZAFEHkTZzfuVhVKcveBnuJd3yVQsEXSRHVU"
    };

    let supabaseClient = null;
    let currentUser = null;
    let liveLeaderboardData = [];
    let chatMessagesList = [];
    let isChatRealtimeSubscribed = false;
    const currentInputMode = 'dy';
    let radarChartInstance = null;
    let latestServerResult = null;
    let calcDebounceTimer = null;

    if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY && window.supabase) {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
    }

