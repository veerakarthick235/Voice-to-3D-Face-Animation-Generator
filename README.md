# Real-Time Voice-to-3D Facial Animation Generator

A full-stack application that converts **live speech audio** or **text** into **realistic 3D facial animation** using phoneme-to-viseme mapping and real-time 3D rendering.

## 🎯 Features

### Core Capabilities
- **Text-to-Animation**: Type text and generate lip-sync animation instantly
- **Live Audio Recording**: Record from microphone in real-time
- **Audio File Upload**: Support for WAV, MP3, WebM formats
- **3D Facial Rendering**: Real-time parametric face with blendshape morphing
- **Smooth Animation**: 30 FPS playback with interpolation
- **Playback Controls**: Play, pause, seek, and reset animations

### Technical Highlights
- **Rule-based Phoneme Mapping**: No ML training required for MVP
- **WebGL 3D Rendering**: Powered by Three.js and React Three Fiber
- **Real-time Processing**: Low-latency audio-to-animation pipeline
- **Responsive UI**: Glass-morphism design with dark theme
- **RESTful API**: FastAPI backend with MongoDB storage

---

## 🚀 Getting Started

### Usage

**Text Input:**
1. Click "Text Input" tab
2. Type your text in the textarea
3. Click "Generate Animation"
4. Use playback controls to view animation

**Audio Input:**
- **Microphone**: Click "Start Recording" → Speak → "Stop Recording"
- **File Upload**: Drag audio file or click to browse (WAV/MP3/WebM)

---

## 📡 API Endpoints

- `POST /api/animate/text` - Generate animation from text
- `POST /api/animate/audio` - Generate animation from audio
- `GET /api/sessions` - Retrieve animation history
- `GET /api/visemes` - Get phoneme mapping

---

## 🎨 Viseme Blendshapes

| Blendshape | Description | Range |
|------------|-------------|-------|
| `jawOpen` | Lower jaw opening | 0.0 - 0.7 |
| `mouthClose` | Lip compression | 0.0 - 1.0 |
| `mouthPucker` | Lip narrowing | 0.0 - 0.7 |
| `mouthSmile` | Corner lip raise | 0.0 - 0.7 |
| `mouthFunnel` | Lip rounding | 0.0 - 0.4 |

---

## 📚 Tech Stack

- **Frontend**: React 19, Three.js, React Three Fiber, Shadcn/ui
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB
- **3D Graphics**: WebGL, Three.js

---
