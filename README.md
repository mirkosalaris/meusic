# 🎹 Meusic

A custom hybrid desktop app to help you learn piano by connecting your MIDI keyboard, visualizing sheet music, and giving real-time feedback.

## ✨ Features
- Connects to your MIDI keyboard via `mido`
- Displays sheet music (MusicXML) using `Verovio`
- Shows correct/wrong notes in real time with color feedback
- React + Electron frontend with FastAPI + Python backend
- Super easy to extend with new exercises or features
- Stores progress locally using `TinyDB`

## 🚀 Getting Started

### Requirements
- Python 3.10+
- Node.js + npm
- A MIDI keyboard (USB or virtual)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run build
```

### Launch Electron App

```bash
npm install
npm start
```

### Test it
Press a key on your MIDI keyboard and watch a green dot flash when input is received.

## 📦 Stack

- **Frontend:** Electron + React
- **Backend:** FastAPI + WebSocket + Mido
- **Storage:** TinyDB
- **Music Rendering:** Verovio (SVG)

## 🛠️ Dev Notes
All communication is handled via WebSockets for ultra-low-latency response.

## 💡 Future Ideas
- Note tracking and scoring
- Practice mode with performance analytics
- User accounts and cloud sync
- Ear training and sight-reading challenges
