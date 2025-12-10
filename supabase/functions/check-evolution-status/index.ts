import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { serverUrl, apiKey, instanceName } = await req.json();

    if (!serverUrl || !apiKey || !instanceName) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Normalize URL (remove trailing slash if exists)
    const normalizedUrl = serverUrl.replace(/\/$/, "");
    const endpoint = `${normalizedUrl}/instance/connectionState/${instanceName}`;

    console.log(`Checking connection: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // If API returns 404, instance doesn't exist. 
      // If returns 403, key is wrong.
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Evolution API Error: ${response.status} - ${response.statusText}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 for frontend to handle business error
      });
    }

    const data = await response.json();
    
    // The return format of Evolution v1 is usually { instance: {...}, state: "open" }
    // We'll return the raw data for frontend to decide
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});