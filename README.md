# 🌱 EcoGrid — Community Micro-Waste & Energy Optimizer

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.8_Flash-8E75C2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](LICENSE)

> **EcoGrid** is a full-stack, hyper-local zero-waste resource matching and neighborhood micro-grid peak shaving platform powered by multimodal **Google Gemini AI** (`gemini-3.8-flash`) and real-time geospatial dispatch tracking with **CARTO Voyager**.

---

## 📋 Table of Contents

- [Vision & Key Features](#-vision--key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [System Capabilities](#-system-capabilities)
  - [1. Real-Time Command Center & CARTO Voyager Map](#1-real-time-command-center--carto-voyager-map)
  - [2. Multimodal Waste & Surplus Food Scanner](#2-multimodal-waste--surplus-food-scanner)
  - [3. GridPulse™ Micro-Grid Peak Shaving Optimizer](#3-gridpulse-micro-grid-peak-shaving-optimizer)
  - [4. Community Leaderboard & EcoCredit Economy](#4-community-leaderboard--ecocredit-economy)
  - [5. Multilingual Localization (EN, HI, TE)](#5-multilingual-localization-en-hi-te)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the App](#running-the-app)
  - [Production Deployment](#production-deployment)
- [CARTO Basemap Configuration](#-carto-basemap-configuration)
- [Security & Resilience](#-security--resilience)
- [Contributing & License](#-contributing--license)

---

## 🌟 Vision & Key Features

Modern urban centers face two compounding environmental challenges every day:
1. **Commercial & Event Surplus Food Waste**: Tonnes of edible cooked meals and recyclable materials end up in landfills while local shelters and composting hubs urgently require resources.
2. **Substation Peak Demand Spikes**: Evening peak hours (18:00–21:00) strain distribution transformers due to simultaneous EV charging, commercial HVAC, and residential loads.

**EcoGrid** fuses these two frontiers into a cohesive community circular-economy platform:
- **Instant AI Waste Audits**: Upload or snap photos of surplus trays or materials; Gemini estimates weight, spoilage risk, shelf-life, and matches them to nearby community kitchens and recycling hubs.
- **Dynamic Logistics Dispatch**: High-resolution interactive maps with real-time GPS fleet tracking of electric rescue vans moving along calculated geographic trajectories.
- **Collaborative Demand Response**: Automated peak-shaving directives that incentivize citizens to delay power-heavy appliances in exchange for verified EcoCredits.

---

## 🛠 Architecture & Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) with Fast Refresh & TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with dark cyberpunk telemetry theme
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & Motion transitions
- **Mapping**: [Leaflet](https://leafletjs.com/) with CARTO Voyager raster tiles, custom SVG beacons, animated dashed polyline trails, and vehicle camera-following
- **Visualizations**: [Recharts](https://recharts.org/) for real-time solar generation and peak load curves
- **Icons & Polish**: [Lucide React](https://lucide.dev/) and [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti)

### Backend & AI
- **Runtime**: Node.js + [Express](https://expressjs.com/) running with [TSX](https://github.com/privatenumber/tsx)
- **AI SDK**: [`@google/genai`](https://www.npmjs.com/package/@google/genai) utilizing `gemini-3.8-flash`
- **Security**: Strict security headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`), sanitization, request payload bounds, and fail-safe fallback simulations

---

## 🚀 System Capabilities

### 1. Real-Time Command Center & High-Realism CARTO Map
- **CARTO Voyager Tile Integration**: Seamlessly renders CARTO's Voyager raster basemaps (`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=YOUR_KEY`), with 2x High-DPI Retina support (`@2x.png`).
- **Photorealistic Satellite Hybrid Mode**: Combines high-resolution satellite imagery with CARTO Voyager transparent street labels (`voyager_only_labels`) for photorealistic building, road, and tree detail.
- **Realistic Street Navigation & Dynamics**: Rescue vans follow authentic street-level corridors with dynamic cornering deceleration, headlight light beams projecting forward on asphalt, active amber turn signals, brake lights, and luminous breadcrumb trails.
- **3D Aerial Orbit Perspective**: Toggle 25° 3D command orbit perspective for an immersive tactical drone view of the urban district.
- **Live Traffic Speeds & Congestion**: Dynamic color-coded road polylines displaying real-time traffic speeds along key arterial avenues and flyovers.
- **Driver Cockpit HUD & Chase Cam**: Live turn-by-turn navigation instructions ("Turn right onto Commercial Ring in 85m"), analog/digital speedometer, EV battery regenerative braking counter, and cargo temperature monitor.
- **Day / Golden Hour / Night Lighting Simulation**: Sun angle and ambient lighting simulation with active vehicle headlight beams in night mode.
- **Citizen Drop-Pin Reporting**: Click any point on the map to trigger instant surplus food or grid outage reports with exact GPS latitude and longitude coordinates.

### 2. Multimodal Waste & Surplus Food Scanner
- **Multimodal Gemini Vision**: Analyzes uploaded photos or pre-configured sample presets (Catering Trays, E-Waste, Recyclables).
- **Structured AI Classification**:
  - Item category (`surplus_food`, `recyclable`, `e_waste`, `compostable`, `hazardous`)
  - Estimated weight in kilograms and remaining safe shelf life
  - Contamination risk assessment (`low`, `medium`, `high`)
  - Optimal recipient recommendation (Shelters, biogas plants, certified MRFs)
  - Critical hygiene and transport handling instructions
  - Quantified CO2 equivalent (CO2e) avoidance metric

### 3. GridPulse™ Micro-Grid Peak Shaving Optimizer
- **Substation Monitoring**: Live transformer load tracking comparing actual demand against safe substation thresholds (kW).
- **Automated AI Directives**: Ingests solar drop-off curves and generates prioritized 3-step load shifting plans (e.g. EV charger throttling, thermostat pre-cooling drift, battery storage fast-discharge).
- **Citizen Push Broadcasts**: Instantly constructs concise push notifications to mobilize neighborhood participants.
- **Interactive Pledges**: Citizens pledge peak-hour load cuts to earn EcoCredits and relieve grid stress.

### 4. Community Leaderboard & EcoCredit Economy
- **Gamified Recognition**: Tracks neighborhood heroes with tier badges (*EcoGuardian*, *Solar Pioneer*, *Zero-Waste Champion*).
- **Live KPIs**: Aggregate metrics for total waste diverted (kg), meals rescued, active NGO pickups, CO2e mitigated, and peak kilowatts shaved.

### 5. Multilingual Localization (EN, HI, TE)
- Built-in multi-language toggle for **English**, **Hindi (हिन्दी)**, and **Telugu (తెలుగు)**.
- Backend automated translation powered by Gemini AI with safe caching and domain term preservation.

---

## 📂 Project Structure

```
├── .env.example              # Environment variables template
├── metadata.json             # AI Studio applet configuration & capabilities
├── package.json              # Dependencies and run scripts
├── server.ts                 # Express backend, Gemini API proxy, and Vite SSR/middleware
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build setup with React and Tailwind plugins
├── index.html                # HTML entry point with metadata
└── src/
    ├── main.tsx              # App bootstrap with Leaflet styles
    ├── App.tsx               # Main application container and tab navigation
    ├── index.css             # Tailwind CSS imports and custom radar/pulse keyframes
    ├── types/
    │   └── index.ts          # Comprehensive TypeScript interfaces & domain models
    ├── data/
    │   └── mockData.ts       # Initial telemetry, map nodes, and translations
    └── components/
        ├── Header.tsx             # Navigation header, language switcher & credits
        ├── KpiCards.tsx           # Top-level live impact metrics
        ├── CommandCenterTab.tsx   # Fleet monitoring, dispatch feed & map shell
        ├── RealtimeLeafletMap.tsx # Leaflet & CARTO Voyager real-time GPS map
        ├── WasteScannerTab.tsx    # Multimodal image upload & Gemini audit interface
        ├── GridPulseTab.tsx       # Substation overload charts & AI peak shaving
        ├── CommunityLeaderboard.tsx # Neighborhood rankings & EcoCredits
        └── motion/
            └── MotionTransitions.tsx # Framer Motion animated cards, beacons & paths
```

---

## 🔌 API Endpoints

The Express server exposes secure, rate-bounded proxy routes that interface with Google Gemini AI:

| Method | Endpoint | Description | Payload Highlights |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/gemini/scan-waste` | Multimodal waste audit & recipient matching | `{ imageBase64, mimeType, description, samplePresetId }` |
| `POST` | `/api/gemini/grid-alert` | AI-generated peak-shaving dispatch directive | `{ currentPeakKw, thresholdKw, solarKw, hourTime }` |
| `POST` | `/api/gemini/translate` | Localized notification and UI translation | `{ targetLanguage: 'hi' \| 'te', texts: string[] }` |

> **Note**: If `GEMINI_API_KEY` is not provided or the network is unreachable, each endpoint gracefully serves high-fidelity simulated fallback data, ensuring uninterrupted development and testing.

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm`, `pnpm`, or `bun` package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ecogrid-optimizer.git
   cd ecogrid-optimizer
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Add your Google Gemini API Key:
```env
# Get a key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key-here"

# Application host port (defaults to 3000)
PORT=3000
```

### Running the App

Start the development server with Hot Module Replacement and Express proxy:
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

### Production Deployment

1. **Build the client bundle**:
   ```bash
   npm run build
   ```

2. **Launch the production server**:
   ```bash
   npm start
   ```

---

## 🗺 CARTO Basemap Configuration

EcoGrid comes pre-configured with **CARTO Voyager** raster tiles:
```
https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=YOUR_KEY
```

- **High-DPI Retina Support**: Automatically toggles `@2x.png` tiles (`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=YOUR_KEY`) for crisp micro-typography and sharp road linework on high-resolution displays.
- **Key Persistence**: Supply your custom CARTO API Key directly inside the app using the **Settings (⚙)** modal in the map bar; the key is securely saved to `localStorage` and automatically appended to tile requests.
- **Default Public CDN**: If left blank, the app runs out-of-the-box using the public CARTO Voyager CDN.

Supported Basemap Modes:
- **CARTO Voyager**: Vibrant, high-contrast urban cartography with rich land use and crisp street labels.
- **Photorealistic Satellite**: High-resolution aerial satellite imagery underlaid with transparent CARTO Voyager road and neighborhood labels (`voyager_only_labels`).
- **Dark Matter**: Low-light tactical command center theme with illuminated vehicle headlights and feeder grid lines.
- **Positron**: Clean, minimal monochromatic architectural map.


---

## 🛡 Security & Resilience

- **Server-Side API Key Shielding**: Client-side code never touches the `GEMINI_API_KEY`. All Gemini SDK interactions are proxied through Node.js Express.
- **Strict Payload & MIME Controls**: Image inputs are strictly validated against `image/jpeg`, `image/png`, and `image/webp` with strict size ceilings (15MB).
- **Graceful Fault Tolerance**: Built-in timeout guards (4.5s) ensure that any API latency or upstream unavailability immediately defaults to contextual fallback data without breaking the user experience.
- **Production-Ready Headers**: Standard hardened headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`) are applied across all routes.

---

## 📄 Contributing & License

Contributions, bug reports, and feature proposals are welcome! Please feel free to open an issue or pull request.

This project is open-source and licensed under the [Apache-2.0 License](LICENSE).
