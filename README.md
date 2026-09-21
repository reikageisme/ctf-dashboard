# 🛡️ 6h4T 9pT pR0 CTF Dashboard v2.5

**A cyberpunk-themed, real-time CTF team dashboard with threat intelligence feeds**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green?logo=github)](https://github.com/features/actions)
[![GHCR](https://img.shields.io/badge/GHCR-BaoDarius-blueviolet?logo=github)](https://github.com/BaoDarius?tab=packages)

---

## 🚀 Quick Start

### Docker Deployment (Recommended)

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/sudo-baoz/ctf-dashboard:latest

# Run
docker run -d -p 7000:7000 ghcr.io/sudo-baoz/ctf-dashboard:latest

# Or use docker-compose
docker compose up -d
```

**Access**: http://localhost:7000

### Traditional Deployment

```bash
npm install
npm start
```

---

## ✨ Features

<div align="center">

![CTF Dashboard](https://img.shields.io/badge/CTF-Dashboard-00ff41?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.5.0-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green?style=for-the-badge)

**Cyberpunk-themed CTF Team Intelligence Dashboard**

Real-time tracking, interactive terminal, hidden flags, and more!

</div>

---

## 🌟 Features

### 🎨 Visual System
- **Modern Cyber Ops UI**: Bento cards, semantic colors, and restrained neon accents
- **Text Scramble**: Lightweight decode effect when team data loads
- **Responsive Design**: Optimized layouts for mobile, tablet, and desktop
- **Accessible Motion**: Reduced-motion support and a pausable threat ticker

### 📊 Dashboard Features
- **Real-time CTFtime API**: Tự động lấy data từ CTFtime.org
- **Interactive Charts**: Biểu đồ traffic với Chart.js
- **Team Statistics**: Ranking, points, missions
- **Upcoming Events**: Lịch thi đấu sắp tới
- **Threat Intelligence Ticker**: Bảng tin SOC style

### 💻 Terminal Mode
- **Press `~` key** để mở terminal ảo
- Commands available:
  ```bash
  help       - Hiển thị danh sách commands
  whoami     - Current user info
  ls         - List files
  cat <file> - Read file content
  members    - Show team members
  flag       - Find hidden flag
  clear      - Clear terminal
  exit       - Close terminal
  ```

### 🚩 Hidden Flags (CTF Easter Eggs)
Dashboard ẩn **3 flags** để bạn tìm:

1. **Flag #1**: Trong CSS source code (`styles.css`)
2. **Flag #2**: Terminal command (`cat flag.txt`)
3. **Flag #3**: HTML comments (View Page Source)

**Bonus**:
- `robots.txt` có thêm flag
- HTTP Response Headers chứa flag
- `cat secrets.log` trong terminal (base64)

---

## 🚀 Installation

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Setup
```bash
# Clone repository
git clone <your-repo-url>
cd ctf-dashboard

# Install dependencies
npm install

# Start server
npm start

# Or use custom port
PORT=7001 npm start
```

---

## 📁 Project Structure

```
ctf-dashboard/
├── public/
│   ├── index.html      # Main HTML (với hidden flag #3)
│   ├── styles.css      # Styles (với hidden flag #1)
│   ├── app.js          # React application logic
│   └── robots.txt      # Robots file (với bonus flag)
├── server.js           # Express server (HTTP header flag)
├── package.json
└── README.md
```

---

## ⚙️ Configuration

### Thay đổi Team ID
Edit `server.js`:
```javascript
const TEAM_ID = '412747'; // Your CTFtime Team ID
```

### Thay đổi Manual Members
Edit `public/app.js`:
```javascript
const MANUAL_MEMBERS = [
    "YourMember1",
    "YourMember2",
    // ...
];
```

---

## 🎮 Usage

### 1. Start Server
```bash
node server.js
```

### 2. Access Dashboard
```
http://localhost:7000
```

### 3. Terminal Mode
- Press **`~`** key anywhere on the page
- Type commands and explore
- Find hidden flags!

### 4. Mobile View
Dashboard tự động responsive:
- **Desktop**: Full layout với 4 columns
- **Tablet**: 2 columns layout
- **Mobile**: Single column, optimized touch

---

## 🎨 Customization

### Colors
The theme is driven by semantic CSS variables in `public/styles.css`:

```css
:root {
    --primary: #22d3a6;
    --surface: rgba(12, 19, 17, 0.88);
    --text: #edf6f2;
}
```

### Threat Ticker Messages
Threat data is fetched by `/api/threats` in `server.js` and cached for five minutes.

---

## 🔧 API Endpoints

### `GET /api/intel`
Fetch team intelligence từ CTFtime API

**Response:**
```json
{
  "team": {
    "name": "S0CI3TY",
    "logo": "...",
    "rank": "123",
    "points": 45.67,
    "country_rank": "5",
    "year": "2026"
  },
  "members": ["Member1", "Member2"],
  "missions": [...],
  "upcoming": [...],
  "status": "LINKED"
}
```

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Use different port
PORT=7001 node server.js
```

### Members not showing
- CTFtime API có thể không public members
- Dashboard sẽ dùng `MANUAL_MEMBERS` fallback
- Check `server.js` logs để debug

### Terminal not opening
- Đảm bảo press đúng phím **`~`** (backtick/grave)
- Không phải phím **`'`** (single quote)

---

## 🎯 CTF Challenge Hints

### Flag Locations
1. **View Page Source** (Ctrl+U)
2. **Developer Tools** → Network → Response Headers
3. **Visit** `/robots.txt`
4. **Open Terminal** (Press ~)
5. **Check** `/styles.css` source

### Terminal Easter Eggs
```bash
cat secrets.log    # Base64 decode the output!
cat flag.txt       # Direct flag
cat members.txt    # Team list
```

---

## 📚 Technologies Used

- **Frontend**: React 18, custom CSS design system, esbuild
- **Backend**: Node.js, Express
- **Charts**: Chart.js
- **Animations**: CSS transforms/opacity with reduced-motion support
- **API**: CTFtime.org API
- **Fonts**: JetBrains Mono

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit PRs

---

## 📜 License

MIT License - Feel free to use for your CTF team!

---

## 👥 Credits

**Made with 💚 by S0CI3TY Team**

- CTFtime Team ID: 412747
- Website: [Your Website]
- Discord: [Your Discord]
- GitHub: [Your GitHub]

---

## 🎉 Changelog

### v2.5.0 (Current)
- ✨ Added Terminal Mode (Press ~)
- 🎨 Text Scramble effects
- 📊 Interactive Chart.js integration
- 🎯 3+ Hidden Flags (CTF Easter Eggs)
- 📱 Full mobile responsive
- 🎪 Threat Intelligence Ticker
- 🎭 Enhanced CRT/Glitch effects
- 📦 Modular file structure (CSS + JS separated)
- 🔒 HTTP Security Headers with hidden flag

### v2.0.0
- 🎨 Ambient grid background
- 📊 Chart.js network traffic
- ⚡ CRT screen effects
- 🎭 Glitch animations

### v1.0.0
- 🚀 Initial release
- 📡 CTFtime API integration
- 📊 Basic dashboard layout

---

<div align="center">

**[⬆ Back to Top](#-s0ci3ty-ctf-dashboard-v25)**

Made for CTF Teams • Cybersecurity • Learning

</div>
