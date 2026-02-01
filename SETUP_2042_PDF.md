# Setup Instructions for 2042 PDF Integration

## Overview
This implementation replaces the table-based form 2042 view with a PDF viewer that displays the official French tax form 2042. The PDF is stored in Vercel Blob (public, globally distributed storage).

## What Changed

### 1. **Files Added**
- `/components/pdf-2042-viewer.tsx` - PDF viewer component with embed + download functionality
- `/components/form-2042-settings.tsx` - Admin settings to upload/manage 2042 PDF
- `/app/api/upload-2042/route.ts` - API endpoint to upload 2042 PDF to Vercel Blob
- `/app/api/get-2042-pdf/route.ts` - API endpoint to retrieve 2042 PDF URL from Blob
- `/app/actions/upload-2042-action.ts` - Server action for initial PDF upload
- `/public/2042.pdf` - The 2042 form PDF file

### 2. **Files Modified**
- `/components/form-2042-view.tsx` - Now uses PDF viewer instead of table view
- `/components/integrations-view.tsx` - Added 2042 settings section

## How to Use

### Initial Setup

1. **Navigate to Settings**
   - In the left sidebar, go to: `Paramètres` (Settings)
   - You'll see a new section: "Formulaires fiscaux"

2. **Upload the 2042 PDF**
   - Click the "Uploader le formulaire 2042" button
   - This uploads the PDF from `/public/2042.pdf` to Vercel Blob
   - The PDF gets a public, permanent URL stored in Blob

3. **Verify Upload**
   - You'll see a success message with the Blob URL
   - The PDF is now accessible to all users

### Using the 2042 Form

1. **View the Form**
   - Open a client's record
   - Click on the "Déclarations" tab
   - The 2042 form will display as a PDF viewer (not the table anymore)

2. **Features**
   - Full PDF viewer with zoom, search, navigation
   - Download button to download the PDF
   - Same view for all users (the official form template)

## Architecture

### Storage Flow
```
local /public/2042.pdf 
  ↓
Server Action (uploadForm2042PDFFromFile)
  ↓
Vercel Blob (PUT request)
  ↓
Public URL stored in Blob
  ↓
PDF Viewer fetches from /api/get-2042-pdf
  ↓
iframe displays PDF to users
```

### Key Components

**PDF2042Viewer** (`/components/pdf-2042-viewer.tsx`)
- Fetches PDF URL from backend
- Displays in responsive iframe
- Includes download button
- Error handling for missing PDF

**Form2042Settings** (`/components/form-2042-settings.tsx`)
- Admin UI to trigger upload
- Shows upload status and blob URL
- Clear feedback on success/failure

## API Endpoints

### POST `/api/upload-2042`
Uploads a PDF file to Vercel Blob
```javascript
// Request
const formData = new FormData()
formData.append('file', pdfFile)
fetch('/api/upload-2042', { method: 'POST', body: formData })

// Response
{ url: "https://...", filename: "2042-template.pdf", size: 123456, type: "application/pdf" }
```

### GET `/api/get-2042-pdf`
Retrieves the 2042 PDF URL from Blob
```javascript
fetch('/api/get-2042-pdf')
// Response
{ url: "https://...", filename: "2042-template.pdf", size: 123456 }
```

## Notes

- ✅ Same 2042 PDF shown to all users (template form)
- ✅ PDF is public and cached by Vercel's CDN
- ✅ No authentication needed for PDF viewing
- ✅ Download button allows users to save locally
- ✅ Replaces table-based form entry (old form data storage still works)
- ✅ Mobile responsive iframe viewer

## Troubleshooting

### "PDF 2042 not found"
- Ensure `/public/2042.pdf` exists
- Run the upload server action from settings

### PDF doesn't display
- Check browser console for errors
- Verify Blob URL is accessible
- Check CORS/CSP headers in network tab

### Slow PDF load
- PDF is cached by Vercel CDN after first load
- Second loads will be instant

## Environment Variables
No additional env vars needed - uses existing `BLOB_READ_WRITE_TOKEN` from Vercel integration.

---

The 2042 form PDF is now displayed using Vercel Blob for storage and an iframe for viewing, replacing the previous table-based interface. This provides a cleaner, more official form experience to users.
