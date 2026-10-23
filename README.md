# CineVault — Personal Movie Library & Streaming App

A sleek, modern, single-user movie library web application inspired by the browsing experience of Netflix, built for personal and private use to catalog, stream, and download your legally owned movie files.

![Dark Theme](https://img.shields.io/badge/Theme-Dark%20Cinematic-141414?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

---

## Features

- **Cinematic Netflix-Inspired UI**: Dark charcoal aesthetic (`#141414`), deep crimson accents (`#E50914`), hero spotlight banner, smooth card zoom animations, responsive grid, and custom dark scrollbars.
- **HTTP 206 Byte-Range Video Streaming**: Stream high-definition movies directly in the native HTML5 player with instant seeking and buffering without having to download the entire video into memory.
- **Direct Video Downloads**: Download original movie video files directly to your computer with clean, sanitized filenames and proper `Content-Disposition: attachment` headers.
- **Movie Catalog & Metadata Management (CRUD)**: Add new movies with poster artwork and video files, edit descriptions, years, and runtimes, and delete movies with safe automatic file purging from disk.
- **Upload Progress Tracker**: Real-time upload percentage bar powered by Axios `onUploadProgress` to monitor large video uploads.
- **Instant Search & Genre Filtering**: Search by title, synopsis, or genre with real-time responsive filtering, sorting (Newest, Oldest, Title A-Z, Release Year), and active genre pills.
- **Library Storage Overview**: Track total movies, disk space consumed in MB/GB, and total watch time in a dedicated statistics modal.
- **Zero Orphaned Files**: Automatic rollback and disk cleanup if database insertion fails or when media is replaced/deleted.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Lucide Icons, Vanilla CSS with reusable components |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Database** | MongoDB with Mongoose ODM |
| **File Storage** | Multer disk storage (posters in `server/uploads/posters/`, videos in `server/uploads/videos/`) |
| **Streaming** | Native Node.js `fs.createReadStream` with HTTP Range headers (206 Partial Content) |
| **HTTP Client** | Axios with Vite proxy (`/api` and `/uploads` -> `:5000`) |

---

## Project Structure

```
Movie_Project/
├── client/                     # Frontend React + Vite application
│   ├── public/
│   │   └── favicon.svg         # CineVault SVG branding
│   ├── src/
│   │   ├── components/         # Navbar, HeroBanner, MovieCard, MovieGrid, FilterBar, Modals
│   │   ├── pages/              # HomePage, MovieDetailsPage, VideoPlayerPage, AddMoviePage, EditMoviePage
│   │   ├── services/           # Axios API client (api.js)
│   │   ├── styles/             # theme.css and index.css
│   │   ├── App.jsx             # React Router routing setup
│   │   └── main.jsx            # React root entrypoint
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Dev proxy configuration
├── server/                     # Backend Express REST API
│   ├── config/
│   │   └── db.js               # MongoDB Mongoose connection
│   ├── controllers/
│   │   └── movieController.js  # CRUD, HTTP 206 streaming, download, stats
│   ├── middleware/
│   │   ├── upload.js           # Multer media storage configuration
│   │   └── errorHandler.js     # Centralized error handler
│   ├── models/
│   │   └── Movie.js            # Mongoose schema
│   ├── routes/
│   │   └── movieRoutes.js      # REST API route definitions
│   ├── utils/
│   │   └── fileHelper.js       # Safe disk file cleanup and path resolution
│   ├── uploads/                # Local disk storage
│   │   ├── posters/            # Stored movie poster images
│   │   └── videos/             # Stored movie video files
│   ├── .env.example
│   ├── package.json
│   ├── seed.js                 # Sample movie and video seeder
│   └── server.js               # Express application bootstrap
├── .gitignore
├── package.json                # Root package runner with concurrently
└── README.md
```

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
*(Or individually run `npm install` inside the root, `server/`, and `client/` directories).*

### 3. Configure Environment Variables
A default `.env` file is prepared in `server/.env`. You can adjust settings if needed:
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

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/movies` | Retrieve all movies (supports `?search=`, `?genre=`, `?sort=`) |
| `GET` | `/api/movies/:id` | Retrieve single movie by ID |
| `POST` | `/api/movies` | Add a new movie with poster and video uploads |
| `PUT` | `/api/movies/:id` | Update movie metadata and optionally replace media files |
| `DELETE` | `/api/movies/:id` | Delete a movie and remove its poster and video from disk |
| `GET` | `/api/movies/:id/stream` | Stream movie with HTTP 206 Partial Content byte ranges |
| `GET` | `/api/movies/:id/download` | Download original movie file |
| `GET` | `/api/movies/stats/overview` | Retrieve library count, storage used, and directories |

---

## Keyboard Shortcuts in Video Theater Mode

- `Space`: Play / Pause
- `Arrow Left`: Seek backward 10 seconds
- `Arrow Right`: Seek forward 10 seconds
- `Arrow Up`: Increase volume by 10%
- `Arrow Down`: Decrease volume by 10%
- `F`: Toggle Fullscreen
- `M`: Toggle Mute

---

## License

Personal and private use only.
