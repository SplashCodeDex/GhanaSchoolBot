# Ghana School Bot - Educational Resource Scraper

An intelligent educational resource scraper designed to collect, organize, and sync educational materials from Ghanaian educational websites.

## Features

- **Web Scraping**: Automated scraping of educational resources using Playwright
- **AI-Powered Classification**: Uses Google Gemini AI to categorize files by grade and subject
- **Google Drive Integration**: Automatic upload and organization to Google Drive
- **Real-Time Dashboard**: Web-based control panel with live statistics and logs
- **Comprehensive Stats Tracking**: Monitor downloads, success rates, and performance metrics

## Project Structure

```
educational-scraper/
├── src/
│   ├── main.ts                 # Main crawler entry point
│   ├── server.ts               # Express server with WebSocket support
│   ├── routes.ts               # Crawler route handlers
│   ├── sync-existing.ts        # Sync existing files to Drive
│   ├── sync-intelligent.ts     # AI-powered intelligent sync
│   ├── test-upload.ts          # Test file (isolated from production)
│   └── utils/
│       ├── ai-sorter.ts        # Gemini AI classification service
│       ├── drive-uploader.ts   # Google Drive upload service
│       ├── file-downloader.ts  # File download utilities
│       ├── file-scanner.ts     # Directory scanning utilities
│       ├── stats-manager.ts    # Real-time statistics tracking
│       └── generate-tokens.ts  # OAuth token generator
├── config.json                 # Main configuration file
└── package.json

web/                            # Frontend dashboard
├── src/
│   ├── App.tsx                 # Main React app
│   └── components/
│       ├── StatCard.tsx        # Statistics display card
│       ├── ControlPanel.tsx    # Start/Stop controls
│       ├── FileManager.tsx     # File browser
│       └── LogViewer.tsx       # Real-time log viewer
```

## Setup

### 1. Install Dependencies

```bash
cd educational-scraper
npm install

cd ../web
npm install
```

### 2. Configure Google Drive (Optional)

1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Download credentials JSON and place in project root
5. Run token generator:

```bash
npm run generate:tokens
```

### 3. Configure Gemini API (For AI Sorting)

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `geminiApiKey` in `config.json`

### 4. Update Configuration

Edit `educational-scraper/config.json`:

```json
{
  "geminiApiKey": "YOUR_GEMINI_API_KEY",
  "startUrls": ["https://example.com"],
  "maxConcurrency": 5,
  "allowedOrigins": ["http://localhost:5173"]
}
```

## Usage

### Running the Scraper

**Option 1: Via Dashboard (Recommended)**

```bash
# Terminal 1: Start backend server
cd educational-scraper
npm run server

# Terminal 2: Start frontend dashboard
cd web
npm run dev
```

Then open http://localhost:5173 and use the dashboard controls.

**Option 2: Direct Execution**

```bash
cd educational-scraper
npm start
```

### Testing Features

```bash
# Test Google Drive upload
npm run test:upload

# Sync existing files to Drive
npm run sync:existing

# AI-powered intelligent sync
npm run sync:intelligent
```

## Scripts Reference

### Production Scripts
- `npm run server` - Start the backend API server
- `npm start` - Run the main crawler
- `npm run sync:existing` - Sync existing downloads to Drive
- `npm run sync:intelligent` - AI-powered file organization and sync

### Development/Test Scripts
- `npm run test:upload` - Test Google Drive upload (creates test file)

## Statistics Tracked

The system tracks comprehensive real-time metrics:

- **Files Downloaded**: Total files successfully downloaded
- **Active Threads**: Current/Max concurrent crawler threads
- **URLs Processed**: Total URLs crawled
- **Success Rate**: Percentage of successful operations
- **Download Speed**: Files per minute
- **Errors**: Total error count

All statistics are persisted to `stats.json` and survive server restarts.

## Security Features

- **CORS Protection**: Configurable allowed origins
- **Environment-based Config**: Production vs development modes
- **Test File Isolation**: Test files excluded from production paths
- **Credentials Protection**: Git-ignored sensitive files

## File Organization

Files are organized by:
1. **Grade**: Grade7_JHS1, Grade8_JHS2, Grade9_JHS3, SHS1, SHS2, SHS3
2. **Subject**: Mathematics, Science, English, etc.
3. **Review Queue**: Files with low confidence go to `Review_Needed/`

## Troubleshooting

### Google Drive Upload Issues
- Ensure OAuth tokens are generated: `npm run generate:tokens`
- Check credentials path in `config.json`
- Verify folder ID has correct permissions

### AI Classification Not Working
- Verify `geminiApiKey` in config.json
- Check API quota limits
- Review logs for rate limit messages

### Frontend Not Connecting
- Ensure backend server is running on port 3001
- Check `allowedOrigins` in config.json
- Verify WebSocket connection in browser console

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

ISC
