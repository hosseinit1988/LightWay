<div dir="rtl" align="center">

# 🌟 LightWay 
## ⚡ رله عبور از فیلترینگ DPI

[![License](https://img.shields.io/badge/مجوز-AGPLv3-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/پلتفرم-Cloudflare%20%2B%20Google-orange.svg)]()
[![Language](https://img.shields.io/badge/زبان-JavaScript-yellow.svg)]()
[![Free](https://img.shields.io/badge/رایگان-100%25-green.svg)]()

</div>

<div dir="rtl" align="right">

## 📖 معرفی پروژه

**LightWay** یک پروکسی رله ساده، سبک و کاملا **رایگان** برای دور زدن فیلترینگ اینترنت در ایران است. این پروژه ترافیک شما را از طریق زیرساخت رایگان **Google Apps Script** و **Cloudflare Worker** هدایت می‌کند بدون اینکه نیاز به خرید سرور یا VPS داشته باشید.

</div>

<div dir="rtl" align="right">

## 🧠 روش کار

سیستم فیلترینگ ایران (DPI) با خواندن نام سایت‌ها (SNI) در ابتدای ارتباط، آنها را شناسایی و مسدود می‌کند. LightWay با استفاده از تکنیک **Domain Fronting** این محدودیت را دور می‌زند:

</div>

<div dir="rtl" align="right">

| مرحله | توضیح |
|-------|-------|
| 1️⃣ | درخواست شما ابتدا به **Google Apps Script** فرستاده می‌شود |
| 2️⃣ | از دید فیلتر، این ترافیک شبیه ارتباط عادی با گوگل است |
| 3️⃣ | Google Apps Script درخواست را به **Cloudflare Worker** شما ارسال می‌کند |
| 4️⃣ | Cloudflare Worker سایت مقصد (مثلا اینستاگرام) را دریافت کرده و برمی‌گرداند |

</div>

<div dir="rtl" align="right">

## ✨ امکانات پروژه

| ویژگی | توضیح |
|-------|-------|
| 💰 **کاملا رایگان** | استفاده از سطوح رایگان گوگل و کلادفلر |
| 🖥️ **بدون نیاز به سرور** | نیازی به خرید VPS یا سرور ندارید |
| 🔧 **نصب آسان** | فقط کافیست کدها را کپی کنید |
| 🔐 **امنیت بالا** | دارای کلید احراز هویت اختصاصی |
| 📱 **پشتیبانی از Zyrln** | کار بر روی ویندوز، لینوکس، مک و اندروید |
| 🌍 **دسترسی کامل** | به تمام سایت‌ها (اینستاگرام، توییتر، تلگرام و ...) |

</div>

<div dir="rtl" align="right">

## 📦 پیش نیازها

برای راه‌اندازی این پروژه به موارد زیر نیاز دارید:

- ✅ یک **حساب گوگل** (رایگان)
- ✅ یک **حساب کلادفلر** (سطح رایگان کافی است)
- ✅ اپ **Zyrln** که از گیتهاب اصلی آن دانلود کنید

</div>

---

<div dir="rtl" align="right">

## 🚀 آموزش گام به گام

### 📌 مرحله 1 - ساخت Cloudflare Worker

وارد حساب کلادفلر خود شوید و مراحل زیر را انجام دهید:

1. وارد [dash.cloudflare.com](https://dash.cloudflare.com/) شوید
2. به بخش **Workers & Pages** بروید
3. روی **Create application** کلیک کنید
4. گزینه **Create Worker** را انتخاب کنید
5. یک نام برای Worker خود انتخاب کنید (مثلا `lightway`)
6. روی دکمه **Deploy** کلیک کنید
7. حالا روی دکمه **Edit code** کلیک کنید
8. تمام کدهای داخل ادیتور را پاک کنید
9. کد زیر را کامل کپی کرده و در ادیتور جایگذاری کنید:

</div>

```javascript
// LightWay - Cloudflare Worker (خروجی زنجیره)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/') {
      return new Response('Not Found', { status: 404 });
    }
    try {
      const body = await request.json();
      const targetUrl = body.url;
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const method = body.method || 'GET';
      const headers = new Headers(body.headers || {});
      const requestBody = body.body;
      headers.delete('host');
      headers.delete('origin');
      headers.delete('referer');
      if (!headers.has('user-agent')) {
        headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      }
      const response = await fetch(targetUrl, {
        method: method,
        headers: headers,
        body: requestBody
      });
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (!['content-encoding', 'transfer-encoding', 'connection'].includes(lowerKey)) {
          responseHeaders[key] = value;
        }
      });
      const responseBody = await response.arrayBuffer();
      return new Response(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: Array.from(new Uint8Array(responseBody))
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
```

<div dir="rtl" align="right">

10. روی دکمه **Save and Deploy** کلیک کنید
11. آدرس Worker خود را کپی کنید (شبیه `https://lightway.workers.dev`)

</div>

---

<div dir="rtl" align="right">

### 📌 مرحله 2 - ساخت Google Apps Script

حالا باید اسکریپت گوگل را بسازید که نقش دروازه ورودی را دارد:

1. به [script.google.com](https://script.google.com/) بروید
2. روی **New project** کلیک کنید
3. کد پیش‌فرض را پاک کنید
4. کد زیر را کامل کپی کنید و در ادیتور جایگذاری کنید:

</div>

```javascript
// LightWay - Google Apps Script (دروازه ورودی)

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
```

<div dir="rtl" align="right">

5. دو مقدار بالای کد را ویرایش کنید:
   - **AUTH_KEY**: یک رمز قوی انتخاب کنید (مثلا: `XyZ123!@#abcDEF`)
   - **WORKER_URL**: آدرس Worker مرحله قبل را وارد کنید
6. روی **Save** (آیکون فلاپی دیسک) کلیک کنید
7. روی **Deploy** → **New deployment** کلیک کنید
   - **Type**: Web app
   - **Execute as**: Me
   - **Who has access**: Anyone
8. روی **Deploy** کلیک کنید و مجوزها را تأیید کنید
9. آدرس Web app را کپی کنید (شبیه `https://script.google.com/macros/s/.../exec`)

</div>

---

<div dir="rtl" align="right">

### 📌 مرحله 3 - تنظیم در Zyrln

1. اپ **Zyrln** را اجرا کنید
2. روی دکمه **+** برای ساخت پروفایل جدید کلیک کنید
3. **Relay URL**: آدرس Google Apps Script را وارد کنید
4. **Auth Key**: همان رمزی که در کد Apps Script نوشتید را وارد کنید
5. روی **Save** و سپس **Connect** کلیک کنید
6. پروکسی مرورگر خود را روی **`127.0.0.1:8085`** تنظیم کنید

</div>

---

<div dir="rtl" align="right">

## 🔧 عیب‌یابی

| مشکل | راه حل |
|------|--------|
| ❌ خطای 403 (unauthorized) | رمز Auth Key در Zyrln و Apps Script یکی نیست |
| ❌ خطای 404 (Not Found) | آدرس Worker در کد Apps Script اشتباه وارد شده است |
| ❌ هیچ سایتی باز نمی‌شود | مطمئن شوید Zyrln در حالت Direct Mode نباشد و پروکسی مرورگر درست تنظیم شده باشد |
| ❌ خطای 502 (worker_error) | Cloudflare Worker شما کار نمی‌کند. لاگ‌های Worker را در داشبورد کلادفلر بررسی کنید |

</div>

<div dir="rtl" align="right">

## 🔒 نکات امنیتی

- 🔐 هر کاربر باید **Apps Script و Worker مخصوص خودش** را بسازد
- 🤫 هرگز **AUTH_KEY** خود را با دیگران به اشتراک نگذارید
- 📁 هرگز کلیدها و فایل‌های حساس را در گیتهاب commit نکنید
- 👁️ گوگل و کلادفلر می‌توانند متادیتا (زمان و حجم ترافیک) را ببینند، اما محتوای رمز شده را نمی‌توانند بخوانند

</div>

<div dir="rtl" align="right">

## 📜 لایسنس

این پروژه تحت مجوز **GNU Affero General Public License v3.0 (AGPL-3.0)** منتشر شده است.

</div>

<div dir="rtl" align="right">

## 🤝 مشارکت

برای مشارکت در این پروژه می‌توانید:

- ⭐ با **ستاره دادن (Star)** از پروژه حمایت کنید
- 🐛 با **گزارش مشکلات (Issue)** کمک کنید
- 🔄 با ارسال **Pull Request** بهبودها را اعمال کنید

</div>

---

<div dir="rtl" align="center">

**❤️ توسعه داده شده برای اینترنت آزاد ❤️**

</div>
