// SPDX-License-Identifier: AGPL-3.0-only
// LightWay - Google Apps Script (Front Door)

const AUTH_KEY = "your-strong-password-here";
const WORKER_URL = "https://your-worker.workers.dev";

function doPost(e) {
  if (!e.parameter || e.parameter.auth !== AUTH_KEY) {
    return returnJson({ error: 'unauthorized' }, 403);
  }

  try {
    const requestData = JSON.parse(e.postData.contents);
    
    if (!requestData.url) {
      return returnJson({ error: 'bad_request' }, 400);
    }

    const workerResponse = UrlFetchApp.fetch(WORKER_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        url: requestData.url,
        method: requestData.method || 'GET',
        headers: requestData.headers || {},
        body: requestData.body || null
      }),
      muteHttpExceptions: true
    });

    const responseCode = workerResponse.getResponseCode();
    const responseText = workerResponse.getContentText();
    
    if (responseCode !== 200) {
      return returnJson({ error: 'worker_error' }, 502);
    }

    const workerResult = JSON.parse(responseText);
    
    if (workerResult.error) {
      return returnJson(workerResult, 502);
    }

    let body = workerResult.body;
    if (workerResult.headers && workerResult.headers['content-type']) {
      const contentType = workerResult.headers['content-type'].toLowerCase();
      if (contentType.includes('text/') || contentType.includes('json')) {
        body = String.fromCharCode.apply(null, body);
      }
    }

    return returnJson({
      status: workerResult.status,
      statusText: workerResult.statusText,
      headers: workerResult.headers,
      body: body
    }, 200);

  } catch (error) {
    return returnJson({ error: error.toString() }, 500);
  }
}

function doGet() {
  return ContentService.createTextOutput('LightWay Relay is running. Use POST method.');
}

function returnJson(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(statusCode);
}
