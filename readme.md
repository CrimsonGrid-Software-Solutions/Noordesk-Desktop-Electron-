# NoorDesk 🌙

NoorDesk is a completely free, open-source, cross-platform desktop application built with [Electron](https://www.electronjs.org/) designed to bring essential daily Islamic tools directly to your desktop. This is a free software project meant to be accessible and used by everyone.

## 🚀 Detailed Features

### 1. Interactive Main Dashboard
* **Purpose:** Serves as the central command hub for the application (`index.html`, `dashboard-renderer.js`, `dashboard.css`).
* **Key Capabilities:**
  * **Unified Layout:** Provides clean navigation between daily prayer schedules, settings, and upcoming features.
  * **Dynamic UI Updates:** Connects seamlessly with Electron’s IPC (Inter-Process Communication) via `preload.js` to render real-time date, time, and status changes without requiring page reloads.

### 2. Daily Prayer Times & Countdown
* **Purpose:** Calculates and displays accurate daily Islamic prayer timings (`prayer.html`, `prayer-renderer.js`, `prayer.css`).
* **Key Capabilities:**
  * **Schedule View:** Displays full daily timings for Fajr, Dhuhr, Asr, Maghrib, and Isha.
  * **Live Countdown:** Highlights the current active prayer window and displays a live timer counting down to the next upcoming prayer.
  * **Clean Visual Styling:** Uses custom CSS (`prayer.css`) tailored for low eye strain during daily use.

### 3. Azan Audio Alert System
* **Purpose:** Plays an audio call to prayer (Azan) when prayer times arrive (`azan.mp3`).
* **Key Capabilities:**
  * **Automated Audio Trigger:** Monitors system time in the background and automatically triggers the embedded audio (`azan.mp3`) at exact prayer intervals.
  * **Seamless Background Playback:** Plays directly through Electron without forcing the main app window to interrupt user work.

### 4. Custom Desktop Notifications
* **Purpose:** Delivers non-intrusive, native-feeling desktop alerts (`notification.html`, `notification-renderer.js`).
* **Key Capabilities:**
  * **Dedicated Popups:** Uses a custom notification window (`notification.html`) rather than relying purely on plain OS popups, giving alerts a modern, consistent look across devices.
  * **Timely Reminders:** Displays upcoming prayer notifications and status alerts directly on the desktop.

### 5. Desktop Core & Startup Automation
* **Purpose:** Handles window management, lifecycle events, and system integration (`main.js`, `preload.js`, `start.bat`).
* **Key Capabilities:**
  * **Secure IPC Bridge:** `preload.js` safely bridges backend Node.js tasks with frontend renderer views while keeping context isolation enabled.
  * **Windows Batch Launcher (`start.bat`):** Includes a quick execution script allowing Windows users to launch the application directly from the project folder or terminal shortcuts with a single click.

### 6. Quran Reader (🚧 Under Active Development)
* **Purpose:** Designed to allow users to read, study, and navigate the Holy Quran directly within NoorDesk.
* **Current Status:** 
  * Basic framework/navigation structure is integrated, but core features are actively seeking community contributions.

## 🛠️ Tech Stack

* **Framework:** [Electron](https://www.electronjs.org/) (Node.js)
* **Frontend:** HTML, CSS, Vanilla JavaScript
* **Backend/Main Process:** JavaScript (CommonJS)

## 💻 Installation & Setup

To get a local copy up and running, follow these simple steps:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CrimsonGrid-Software-Solutions/Noordesk-Desktop-Electron-
   ```

2. Navigate to the project directory:
   ```bash
   cd NoorDesk
   ```

3. Install the NPM packages:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   npm start
   ```
   *(Windows users can also double-click `start.bat` to launch the app quickly).*

## 🤝 Contributing (We Need You!)

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. **Any contributions you make are greatly appreciated!**

Because NoorDesk is a free software built for the community, **the desire to add and work on entirely new features is always welcome.** If you have an idea for a tool that would help Muslims in their daily lives, we want to hear from you and build it together.

### 🚨 Help Wanted: Read Quran Feature
The **Read Quran** feature is currently in its early stages and is **underdeveloped**. We are actively looking for contributors to help build this out! 
* **Planned Enhancements for Contributors:**
  * Full Surah and Juz selection menus.
  * Arabic text rendering with customizable font sizing and translations.
  * Search capability for specific verses/keywords.
  * Recitation audio streaming integrations.

**How to contribute:**
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the GNU GPL v3 License. See `LICENSE` for more information.
