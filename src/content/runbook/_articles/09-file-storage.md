---
title: File storage (B2)
slug: file-storage-b2
category: Architecture
summary: Where files live, how uploads flow through Multer → StorageService → B2, and signed-URL TTLs.
keywords: [storage, b2, backblaze, upload, file, signed url, portfolio, invoice]
order: 3
updatedAt: 2026-10-06
---

Files live in **Backblaze B2** buckets, one bucket per domain. The backend never serves raw files — it issues short-lived signed URLs that the frontend hits directly.

## Buckets

- `B2_BUCKET_PORTFOLIO`  — portfolio hero images / gallery.
- `B2_BUCKET_INVOICES`   — generated invoice PDFs.
- `B2_BUCKET_REQUESTS`   — attachments on client requests.
- `B2_BUCKET_AVATARS`    — user avatars.

Each is a separate bucket with its own key/secret in `.env`. Signing a URL out of the wrong bucket is a 404.

## Upload path

```
   Browser (multipart/form-data)
       │
       ▼
   NestJS controller
       │  FilesInterceptor('files', MAX, { storage: memoryStorage() })
       │
       ▼
   file: { originalname, buffer, mimetype, size }
       │
       │  content-check:
       │   - allowlist extensions (jpg/pdf/docx/mp4/…)
       │   - blocklist executables (exe/bat/sh/…)
       │   - total size ≤ bucket limit
       │
       ▼
   StorageService.put(bucket, key, buffer, mimetype)
       │
       ▼
       B2 PUT
```

Memory storage means the buffer is held in RAM during the request. The NestJS process must have headroom; big batches of files should be split client-side.

## Signed URL TTLs

- Avatars — **86400s** (24h).
- Portfolio — **900s** (15m).
- Client-request attachments — **900s** (15m).
- Invoices — **900s** (15m).

Short TTLs make it safe to embed signed URLs in a view without leaking them long-term.

## Read path

```
   Browser hits GET /{resource}/:id/files
       ▼
   Controller.getFilesUrls(id)
       ▼
   Service maps rows → signed-URL list:
   [ { originalName, url, mimetype, size }, … ]
       ▼
   Response.  Browser renders.
```

For client requests the shape is `ClientRequestSignedFile[]`.

## File validation rules

**Allowed extensions:**

```
image: .jpg .jpeg .png .webp .gif .heic .heif .bmp .tif .tiff
docs:  .pdf .doc .docx .xls .xlsx .ppt .pptx
text:  .txt .rtf .csv .md
open:  .odt .ods .odp .pages .numbers .key
design: .fig .sketch .xd .psd .ai
media: .mp4 .mov .webm .m4v
```

**Blocked extensions** — executable types:

```
.app .apk .bat .bin .cmd .com .cpl .dll .dmg .exe .gadget .hta
.iso .jar .js .jse .lnk .msi .msp .pkg .ps1 .reg .scr .sh .sys
.vb .vbe .vbs .ws .wsc .wsf
```

Even a filename like `report.docx.exe` is rejected by extension check — the controller returns `400 BadRequest` with `rejectedFiles: [{ name, reason }]`.

## Deleting files

Soft-delete is the default — the DB row is marked deleted but the B2 object is retained for N days before a reaper job clears it. This gives us a recovery window.

Hard-delete is reserved for GDPR requests and runs out-of-band.

## Credentials vault — separate path

The Credentials module stores sensitive data **inside Postgres** as encrypted-attachment blobs, not in B2. Only the vault session token can decrypt. See the Credentials module runbook (TBD).
