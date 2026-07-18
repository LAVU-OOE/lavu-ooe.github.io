const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (!env.APPS_DATA) {
        throw new Error("Datenbank-Binding 'APPS_DATA' wurde nicht gefunden.");
      }

      // --- GET: Alle Apps lesen ---
      if (request.method === "GET") {
        const rawData = await env.APPS_DATA.get("apps_list");
        const apps = rawData ? JSON.parse(rawData) : [];
        return new Response(JSON.stringify(apps), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // --- POST: Neue App hinzufügen ---
      if (request.method === "POST") {
        const newApp = await request.json();
        if ((!newApp.nameDe && !newApp.nameEn && !newApp.name) || !newApp.url) {
          return new Response(JSON.stringify({ error: "Name (DE oder EN) und URL sind Pflichtfelder!" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const rawData = await env.APPS_DATA.get("apps_list");
        let apps = rawData ? JSON.parse(rawData) : [];
        apps.push(newApp);
        await env.APPS_DATA.put("apps_list", JSON.stringify(apps));

        return new Response(JSON.stringify({ added: newApp }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // --- PUT: App aktualisieren ---
      if (request.method === "PUT") {
        const { index, app } = await request.json();
        if (index === undefined || index === null || !app) {
          return new Response(JSON.stringify({ error: "Index und App-Daten sind erforderlich." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const rawData = await env.APPS_DATA.get("apps_list");
        let apps = rawData ? JSON.parse(rawData) : [];
        if (index < 0 || index >= apps.length) {
          return new Response(JSON.stringify({ error: "Ungültiger Index." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        apps[index] = app;
        await env.APPS_DATA.put("apps_list", JSON.stringify(apps));

        return new Response(JSON.stringify({ updated: app }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // --- DELETE: App löschen ---
      if (request.method === "DELETE") {
        const { index } = await request.json();
        if (index === undefined || index === null) {
          return new Response(JSON.stringify({ error: "Index ist erforderlich." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const rawData = await env.APPS_DATA.get("apps_list");
        let apps = rawData ? JSON.parse(rawData) : [];
        if (index < 0 || index >= apps.length) {
          return new Response(JSON.stringify({ error: "Ungültiger Index." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        apps.splice(index, 1);
        await env.APPS_DATA.put("apps_list", JSON.stringify(apps));

        return new Response(JSON.stringify({ deleted: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response("Method not allowed", { status: 405, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};