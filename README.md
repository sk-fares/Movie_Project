# CineVault — Personal Movie Library & Streaming App

A sleek, modern, single-user movie library web application inspired by the browsing experience of Netflix, built for personal and private use to catalog, stream, and download your legally owned movie files.

![Dark Theme](https://img.shields.io/badge/Theme-Dark%20Cinematic-141414?style=for-the-badge)
![PWA Ready](https://img.shields.io/badge/PWA-Installable%20App-E50914?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

---

## Features

- **Cinematic Netflix-Inspired UI**: Dark charcoal aesthetic (`#141414`), deep crimson accents (`#E50914`), hero spotlight banner, smooth card zoom animations, responsive grid, and custom dark scrollbars.
- **Installable Progressive Web App (PWA)**: Works as a website, and can be installed as a standalone mobile or desktop app directly from the browser (Android, iOS, Windows, Mac).
- **HTTP 206 Byte-Range Video Streaming**: Stream high-definition movies directly in the native HTML5 player with instant seeking and buffering without having to download the entire video into memory.
- **Theater Player Controls**: Custom scrubber bar with buffer indicator, resume playback prompt ("Resume from 14:20?"), Picture-in-Picture (PiP), playback speed selector (0.5x to 2x), and volume control.
- **Continue Watching & My List**: Automatically saves your watching progress and displays a "Continue Watching" row on the home page. Bookmark favorites to "My List" with quick filtering.
- **Direct Video Downloads**: Download original movie video files directly to your computer with clean, sanitized filenames and proper `Content-Disposition: attachment` headers.
- **Drag & Drop Media Uploads**: Drag and drop video files (MP4, MKV, WEBM, MOV, AVI) and poster art directly into upload dropzones with real-time percentage progress bars.
- **Instant Search & Genre Filtering**: Search by title, synopsis, or genre with real-time responsive filtering, sorting, and active genre pills.
- **Zero Orphaned Files**: Automatic rollback and disk cleanup if database insertion fails or when media is replaced/deleted.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Lucide Icons, Vanilla CSS with reusable components |
| **PWA** | Web App Manifest, Standalone Display, Apple Touch Icons |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Database** | MongoDB with Mongoose ODM |
| **File Storage** | Multer disk storage (posters in `server/uploads/posters/`, videos in `server/uploads/videos/`) |
| **Streaming** | Native Node.js `fs.createReadStream` with HTTP Range headers (206 Partial Content) |
| **HTTP Client** | Axios with Vite proxy (`/api` and `/uploads` -> `:5000`) |

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`

### 2. Install Dependencies
Run the following from the project root to install dependencies for both the frontend and backend:
```bash
npm run install:all
```

### 3. Configure Environment Variables
A default `.env` file is prepared in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/movielibrary
MAX_FILE_SIZE_MB=5120
```

> **Configuring Large Movie Uploads**: By default, `MAX_FILE_SIZE_MB` is set to `5120` (5GB). If you have larger 4K or BluRay video files (e.g., 10GB - 20GB), simply raise this value in `server/.env` (e.g. `MAX_FILE_SIZE_MB=15360`).

### 4. Seed Sample Movies & Test Video
To populate the database with initial sample movies and a CC0 public-domain video clip for instant playback and seeking testing, run:
```bash
npm run seed
```

### 5. Launch the Application
Start both the Express backend and Vite frontend with a single command from the project root:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## Making It an App (PWA Installation)

CineVault is fully configured as a **Progressive Web App (PWA)**:
- **On Mobile (Chrome/Android)**: Click the "Install App" button in the navigation bar, or open the browser menu (⋮) and tap **"Install App"** / **"Add to Home screen"**.
- **On iPhone (Safari/iOS)**: Tap the **Share** button at the bottom of Safari and select **"Add to Home Screen"**.
- **On Desktop (Chrome/Edge)**: Click the install icon in the URL address bar or the "Install App" button in CineVault to install as a desktop application window.

---

## Deploying to Vercel & Sharing with Friends

To share CineVault online with your friends:

1. **Backend Deployment**:
   - Because video streaming and disk storage require a running server, host the `server/` directory on a persistent service like [Render.com](https://render.com), [Railway.app](https://railway.app), or a VPS with MongoDB Atlas.
2. **Frontend Deployment on Vercel**:
   - Push your code to GitHub (already linked).
   - Go to [Vercel](https://vercel.com) and import the repository.
   - Set the **Root Directory** to `client`.
   - In Environment Variables, set `VITE_API_URL` to your live backend URL (e.g. `https://my-cinevault-api.onrender.com`).
   - Click **Deploy**!
   - Your friends can open the Vercel URL in their browser, watch movies, and even install it onto their phone home screen as an app!

---

## Keyboard Shortcuts in Video Theater Mode

- `Space`: Play / Pause
- `Arrow Left`: Seek backward 10 seconds
- `Arrow Right`: Seek forward 10 seconds
- `Arrow Up`: Increase volume by 10%
- `Arrow Down`: Decrease volume by 10%
- `F`: Toggle Fullscreen
- `M`: Toggle Mute
- `P`: Toggle Picture-in-Picture (PiP)

---

## License

Personal and private use only.
