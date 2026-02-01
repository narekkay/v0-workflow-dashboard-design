# 2042 PDF Implementation - Quick Start

## 🎯 What Changed

**In Déclarations → 2042:**
- Before: Table with search bar and form fields
- After: Professional PDF viewer (same form for all users)

## ⚡ Quick Setup (3 steps)

### Step 1: Deploy to Vercel
- Push changes to your repo
- Vercel auto-deploys
- Ensure `BLOB_READ_WRITE_TOKEN` is set ✓

### Step 2: Upload the 2042 PDF
1. Open the app
2. Click **Paramètres** (Settings) in sidebar
3. Click **"Uploader le formulaire 2042"**
4. Wait for success message
5. Done! ✅

### Step 3: View the Form
1. Open any client
2. Go to **Déclarations** tab
3. Click **2042**
4. PDF appears! 📄

## 📁 Files Created

| File | Purpose |
|------|---------|
| `/components/pdf-2042-viewer.tsx` | PDF display component |
| `/components/form-2042-settings.tsx` | Upload management UI |
| `/app/api/upload-2042/route.ts` | Upload endpoint |
| `/app/api/get-2042-pdf/route.ts` | Fetch PDF endpoint |
| `/app/actions/upload-2042-action.ts` | Server-side upload |
| `/public/2042.pdf` | The form PDF |

## 📝 Files Modified

| File | Change |
|------|--------|
| `/components/form-2042-view.tsx` | Uses PDF viewer now |
| `/components/integrations-view.tsx` | Added settings section |

## 🔄 Data Flow

```
User opens Déclarations → 2042
    ↓
Form2042View renders
    ↓
PDF2042Viewer loads
    ↓
Fetches /api/get-2042-pdf
    ↓
API queries Vercel Blob
    ↓
Returns PDF URL
    ↓
iframe displays PDF
    ↓
User sees official 2042 form ✓
```

## 🎨 User Features

✓ View official form  
✓ Zoom/pan  
✓ Search text  
✓ Download  
✓ Mobile responsive  

## ⚙️ Backend

- **Storage**: Vercel Blob (public, CDN)
- **Display**: iframe (native PDF viewer)
- **Upload**: One-time setup in Settings
- **Caching**: Automatic via Vercel CDN

## 🚀 Next Steps

1. **Deploy** → Push to GitHub
2. **Set Token** → Add `BLOB_READ_WRITE_TOKEN` to Vercel env vars
3. **Upload** → Use Settings panel to upload PDF
4. **Done** → All clients see the PDF form

## 💡 Pro Tips

- PDF uploads only once (cached forever)
- Same form shown to all users
- Download available for client records
- No additional costs (included in Vercel plan)

## ✅ Verification

After setup, check that:
- [ ] Settings page shows "Formulaires fiscaux" section
- [ ] Upload button works
- [ ] Client opens 2042 and sees PDF
- [ ] PDF viewer controls work (zoom, search, etc.)
- [ ] Download button works

---

**That's it! Your 2042 PDF viewer is live.** 🎉
