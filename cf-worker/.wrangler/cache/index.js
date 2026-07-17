// cf-worker/index.js

export default {
  async fetch(request, env, ctx) {
    // 1. Setup secure CORS headers so your GitHub Pages site can talk to this API
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://lavu-ooe.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 2. Handle Browser Preflight requests (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Safety check: Ensure the database connection exists
      if (!env.APPS_KV) {
        return new Response(
          JSON.stringify({ error: "Database binding APPS_KV is missing in wrangler.toml" }), 
          { status: 500, headers: corsHeaders }
        );
      }

      // Default baseline app layout if your database is completely empty
      const defaultApps = [
        {
          name: "Etiketten-Druckstudio",
          url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
          desc: "Studio for creating and printing standardized container and sorting labels.",
          icon: "🏷️"
        }
      ];

      // 3. HANDLE GET: Fetching the app list to show on your screen
      if (request.method === "GET") {
        const storedApps = await env.APPS_KV.get("apps_list");
        const apps = storedApps ? JSON.parse(storedApps) : defaultApps;
        
        return new Response(JSON.stringify(apps), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } 
      
      // 4. HANDLE POST: Saving a new app when clicking your grid button
      else if (request.method === "POST") {
        const newApp = await request.json();
        
        // Grab current entries, append the new app data, and write back to cloud storage
        const storedApps = await env.APPS_KV.get("apps_list");
        const currentApps = storedApps ? JSON.parse(storedApps) : defaultApps;
        
        currentApps.push(newApp);
        await env.APPS_KV.put("apps_list", JSON.stringify(currentApps));

        return new Response(JSON.stringify(currentApps), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};