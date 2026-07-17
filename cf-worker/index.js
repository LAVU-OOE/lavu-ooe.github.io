export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://lavu-ooe.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (!env.APPS_KV) {
        return new Response(JSON.stringify({ error: "APPS_KV database missing" }), { status: 500, headers: corsHeaders });
      }

      const defaultApps = [
        {
          name: "Etiketten-Druckstudio",
          url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
          desc: "Studio for creating and printing standardized container and sorting labels.",
          icon: "🏷️"
        }
      ];

      if (request.method === "GET") {
        const storedApps = await env.APPS_KV.get("apps_list");
        const apps = storedApps ? JSON.parse(storedApps) : defaultApps;
        return new Response(JSON.stringify(apps), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } 
      
      else if (request.method === "POST") {
        const newApp = await request.json();
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
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
