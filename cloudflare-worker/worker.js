
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2025 [Hossein Shourgashti]
// 
// LightWay - Cloudflare Worker (Exit Relay)
// This worker receives requests from Google Apps Script and fetches the actual website

export default {
  async fetch(request, env, ctx) {
    // Only accept POST requests to the root path
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/') {
      return new Response('Not Found - LightWay relay only accepts POST requests to /', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    try {
      // Parse the request from Apps Script
      const body = await request.json();
      const targetUrl = body.url;
      
      // Validate required fields
      if (!targetUrl) {
        return new Response(JSON.stringify({
          error: true,
          message: 'Missing "url" field in request body'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const method = body.method || 'GET';
      const headers = new Headers(body.headers || {});
      const requestBody = body.body;

      // Remove problematic headers that might cause issues
      headers.delete('host');
      headers.delete('origin');
      headers.delete('referer');
      headers.delete('content-length'); // Let fetch handle this automatically
      
      // Add a realistic User-Agent if not present
      if (!headers.has('user-agent')) {
        headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      }

      // Add security headers to avoid detection
      headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
      headers.set('Accept-Language', 'en-US,en;q=0.9');
      headers.set('Accept-Encoding', 'gzip, deflate, br');
      headers.set('Connection', 'keep-alive');
      headers.set('Upgrade-Insecure-Requests', '1');

      // Fetch the actual target website
      const response = await fetch(targetUrl, {
        method: method,
        headers: headers,
        body: requestBody,
        redirect: 'follow'
      });

      // Prepare response headers (filter out dangerous ones)
      const responseHeaders = {};
      const safeHeaders = ['content-type', 'content-length', 'date', 'server', 'cache-control', 'expires', 'last-modified', 'etag'];
      
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        // Only send safe headers and exclude problematic ones
        if (safeHeaders.includes(lowerKey) && 
            !['content-encoding', 'transfer-encoding', 'connection'].includes(lowerKey)) {
          responseHeaders[key] = value;
        }
      });

      // Get response body as array buffer for binary data support
      const responseBody = await response.arrayBuffer();

      // Return response to Apps Script
      return new Response(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: Array.from(new Uint8Array(responseBody)) // Convert to array for JSON transport
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      // Return error details to Apps Script
      return new Response(JSON.stringify({
        error: true,
        message: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
