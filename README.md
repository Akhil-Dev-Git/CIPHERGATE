# CIPHERGATE

**Track Attendance Just by Looking.**

CIPHERGATE is a real-time biometric facial recognition and attendance tracking platform. It leverages advanced facial detection algorithms to process video streams in real-time, detect faces, and securely log attendance or access events.

## Features

- **Biometric Scanning**: Real-time facial recognition, classification, and confidence scoring.
- **Sleek Interface**: Modern, cyber-themed dark mode UI for landing pages and operator dashboards.
- **Robust API Backend**: Built with React Router and Hono, providing endpoints for face profile management, batch importing datasets, and logging detections.
- **Mobile Companion App**: Includes a React Native / Expo application (`/mobile`) for on-the-go scanning and telemetry checks.
- **Threat Detection Modules**: Python environments and datasets designated for training the computer vision models and parsing multi-angle facial recognition.

## Project Structure

- `src/app/`: Core Web App. Contains the main UI components, landing pages, and API routing (`src/app/api`).
- `mobile/`: React Native (Expo) mobile application for iOS/Android platforms.
- `threat detection/` & `project dataset/`: Python environments, datasets, and ML scripts for analyzing side-face and multi-angle recognition.
- `known_faces/`: Directory containing indexed biometric capture images.

## Tech Stack

- **Web Frontend**: React, React Router 7, Tailwind CSS, Lucide Icons, Vite
- **Backend/API**: Hono, React Router Node
- **Database Architecture**: Serverless PostgreSQL (Neon Database) / Local SQLite mapping
- **Mobile**: React Native, Expo

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun
- Python 3.9+ (for running standalone threat detection scripts)

### Web Application Setup
1. Install dependencies in the root directory:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:4000/`.

### Mobile Application Setup
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```

## Configuration

Database connections and environmental variables should be set in the `.env` file at the root of the project to authenticate your Serverless database and computer vision APIs.

## License

MIT License
