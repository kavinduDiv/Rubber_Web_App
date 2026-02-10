# Rubber Data PWA

Next.js Progressive Web App for Rubber Tree Data Collection.
Includes offline-first capabilities with Dexie.js and MySQL sync.

## Features
- **Offline First**: Works without internet using Dexie.js.
- **Sync**: Auto-syncs to MySQL when online.
- **GPS**: Registers new trees with coordinates.
- **Rush Mode**: Rapid data entry workflow.
- **Export**: Exports data to Excel.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Database**:
   - Edit `.env.local` with your MySQL connection details.
   - Run the setup script to create the database and tables:
     ```bash
     node scripts/setup-db.js
     ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Technical Details
- **Frontend**: Next.js App Router, React, Dexie.js (IndexedDB).
- **Backend API**: Next.js API Routes + MySQL.
- **PWA**: Service Worker caching, Manifest.json.
