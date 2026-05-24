
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2025 [Hossein Shourgashti]
// 
// LightWay - Google Apps Script (Front Door Relay)
// This script receives requests from the local proxy and forwards them to Cloudflare Worker

// ============================================================
// ⚙️ CONFIGURATION - EDIT THESE VALUES
// ============================================================
const AUTH_KEY = "your-strong-password-here";  // Change this! Use a random, strong password
const WORKER_URL = "https://your-worker.workers.dev";  // Your Cloudflare Worker URL
// ============================================================

/**
 * Handle POST requests from the local proxy
 */
function doPost(e) {
  // Authentication check
  if (!e.parameter || e.parameter.auth !== AUTH_KEY) {
    return returnJson({ 
      error: 'unauthorized', 
      message: 'Invalid or missing auth key' 
    }, 403);
  }

  try {
    // Parse the incoming request
    const requestData = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!requestData.url) {
      return returnJson({ 
        error: 'bad_request', 
        message: 'Missing "url" field in request' 
      }, 400);
    }

    // Forward request to Cloudflare Worker
    const workerResponse = UrlFetchApp.fetch(WORKER_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        url: requestData.url,
        method: requestData.method || 'GET',
        headers: requestData.headers || {},
        body: requestData.body || null
      }),
      muteHttpExceptions: true,
      followRedirects: true
    });

    const responseCode = workerResponse.getResponseCode();
    const responseText = workerResponse.getContentText();
    
    // Check if Worker returned an error
    if (responseCode !== 200) {
      return returnJson({ 
        error: 'worker_error', 
        status: responseCode,
        message: 'Cloudflare Worker returned an error'
      }, 502);
    }

    // Parse Worker response
    const workerResult = JSON.parse(responseText);
    
    // Check for error from Worker
    if (workerResult.error) {
      return returnJson(workerResult, 502);
    }

    // Convert body from array back to original format
    let body = workerResult.body;
    if (workerResult.headers && workerResult.headers['content-type']) {
      const contentType = workerResult.headers['content-type'].toLowerCase();
      // For text content, convert array back to string
      if (contentType.includes('text/') || 
          contentType.includes('json') || 
          contentType.includes('xml') ||
          contentType.includes('javascript')) {
        body = String.fromCharCode.apply(null, body);
      }
    }

    // Return final response to local proxy
    return returnJson({
      status: workerResult.status,
      statusText: workerResult.statusText,
      headers: workerResult.headers,
      body: body
    }, 200);

  } catch (error) {
    // Handle any errors during processing
    return returnJson({ 
      error: 'apps_script_error', 
      message: error.toString(),
      stack: error.stack
    }, 500);
  }
}

/**
 * Handle GET requests - useful for testing
 */
function doGet() {
  return ContentService.createTextOutput(
    'LightWay Relay is running!\n\n' +
    'Usage: Send POST requests with:\n' +
    '- auth parameter (your auth key)\n' +
    '- JSON body containing: { "url": "https://example.com", "method": "GET", ... }\n\n' +
    'For more information, visit: https://github.com/[your-username]/LightWay'
  ).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Helper function to return JSON responses
 */
function returnJson(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(statusCode);
}
