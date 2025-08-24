# Space Biology Knowledge Engine

A production-ready RAG + Knowledge Graph system for NASA Space Apps Challenge - "Build a Space Biology Knowledge Engine"

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation & Run

```bash
# Clone and install
git clone <repository-url>
cd space-biology-knowledge-engine
npm install

# Start both frontend and backend
npm run dev

# Or run separately:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3001
```

## 🎯 Demo Script (60-90 seconds for judges)

1. **Landing Search** (15s)
   - Press `Ctrl+K`, type "microgravity bone loss rodents"
   - Hit Enter, observe loading animation
   - Note 5 quick results and "Quick Answer" with citations

2. **Source Filtering** (10s)
   - Toggle OSDR off, see results refresh
   - Note badge counts change

3. **Paper Detail** (20s)
   - Click first result → "Open"
   - Scroll to figures gallery → click figure
   - View "RAG Expand" section with chunk IDs

4. **Knowledge Graph** (15s)
   - Navigate to Knowledge Graph
   - Click "microgravity" node
   - Observe results filter automatically

5. **Comparison** (15s)
   - Add 2 papers to comparison from Results page
   - View auto-generated summary with citations
   - Note confidence scores

6. **Admin Playground** (10s)
   - Go to Admin → click "Seed Database"
   - Confirm 50 items loaded

## 🏗️ Architecture

### Frontend (React + TypeScript + Tailwind)
- **7 Pages**: Landing, Results, Paper Detail, Knowledge Graph, Dataset Explorer, Comparative Analysis, Admin
- **API Integration**: All buttons call real backend endpoints
- **Responsive Design**: NASA-themed with accessible components
- **State Management**: React Query for caching and synchronization

### Backend (Node.js + Express)
- **RESTful API**: All endpoints from specification implemented
- **Mock + Live Modes**: Falls back to seed data when connectors unavailable
- **Caching**: In-memory caching with configurable TTLs
- **Rate Limiting**: Exponential backoff for external APIs

### Data Sources Integration
- **NASA Data Portal**: Via Socrata API
- **OSDR/GeneLab**: Direct API integration
- **PMC**: Europe PMC REST API
- **ADS**: Requires `ADS_TOKEN` environment variable

## 📊 Seed Data

**50 Demo Items**:
- 20 OSDR/GeneLab studies
- 15 PMC papers  
- 10 NASA Data Portal datasets
- 5 ADS bibliographic records

Located in `/seed/demo_items.json`

## 🔧 Configuration

### Environment Variables

```bash
# Backend configuration
PORT=3001
NODE_ENV=development

# Live connector tokens (optional - falls back to mock)
ADS_TOKEN=your_ads_token_here
PMC_EMAIL=your_email@domain.com

# Development
DEV_TOKEN=dev_token_123  # For admin endpoints
```

Create `.env` file in project root for local development.

## 🧪 Testing

### End-to-End Tests
```bash
npm run test:e2e          # Opens Cypress GUI
npm run test:e2e:headless # Runs headless
```

### Manual Testing Checklist
- [ ] Search with natural language query
- [ ] Source toggles update results and counts
- [ ] Paper details load with figures
- [ ] Knowledge graph node filtering works
- [ ] Comparison generates summary
- [ ] Export returns download URL
- [ ] Admin seed loads 50 items

## 📝 API Reference

### Core Endpoints

```bash
# Search with filters
GET /api/search?q=microgravity&sources=nasa,osdr&limit=20

# Paper details with figures and chunks
GET /api/paper/:id

# Knowledge graph with provenance
GET /api/kg?nodeId=microgravity&depth=1

# Dataset preview
GET /api/dataset/:id

# Comparison analysis
POST /api/compare
Content-Type: application/json
{"items": ["osdr-001", "osdr-002"]}

# Export (returns download URL)
POST /api/export
Content-Type: application/json
{"type": "pdf", "items": ["osdr-001"]}

# Source counts for badges
GET /api/counts

# Admin (requires X-DEV-TOKEN header)
POST /api/admin/seed
X-DEV-TOKEN: dev_token_123
```

## 🎨 Design System

### NASA Theme Colors
- `--nasa-deep`: #001540 (deep indigo)
- `--nasa-teal`: #00A3A3 (cosmic teal)  
- `--nasa-orange`: #FF6A00 (sunrise orange)
- `--sky-white`: #F7FAFF (sky white)

### Typography
- **Primary**: Inter (modern sans-serif)
- **Weights**: 400 (regular), 600 (semibold), 700 (bold)

### Accessibility
- WCAG AA compliant contrast ratios
- Keyboard navigation (Ctrl+K for search)
- Semantic HTML5 elements
- ARIA labels on interactive components

## 🔬 RAG Implementation

### Prompt Templates

**Concise Answer:**
```
You are an evidence-based research assistant. Answer the user's question using only the passages listed. For each sentence, append [REF:chunk_id,source]. If you cannot answer, say 'No evidence found in provided passages.' Do not invent facts.
```

**Comparison Summary:**
```
Compare the supplied documents. Provide a one-paragraph synthesis stating similarities and differences. For each claim, include [REF:chunk_id,doc_id]. Rate your confidence 0-1.
```

### Confidence Scoring
- **High** (0.8-1.0): Multiple supporting passages, clear evidence
- **Medium** (0.6-0.79): Some supporting evidence, minor gaps
- **Low** (<0.6): Limited evidence, shows uncertainty note

## 🚦 Production Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy /dist folder
```

### Backend (Render/Railway)
```bash
# Set environment variables
# Deploy backend/ folder
```

### Environment Variables for Production
```bash
# Required
NODE_ENV=production
PORT=3001

# Optional (enables live connectors)
ADS_TOKEN=your_token
PMC_EMAIL=your_email
```

## 📈 Performance Targets

- **UI Response**: <300ms for cached data
- **Live API**: <3s acceptable (with loading indicators)
- **Search**: <500ms with pagination
- **Export**: Background job with status polling

## 🐛 Known Limitations

1. **Live Connectors**: Some APIs require authentication tokens
2. **Vector DB**: Uses simple TF-IDF matching in demo mode
3. **PDF Export**: Returns mock URLs (implement with jsPDF)
4. **Real-time Updates**: No WebSocket integration yet

## 🤝 Contributing

1. **Feature Branches**: One PR per major feature
2. **Documentation**: Update README for new endpoints
3. **Testing**: Add Cypress tests for new flows
4. **Screenshots**: Include GIFs for UI changes

## 📄 License

This project is developed for the NASA Space Apps Challenge 2024. Data sources maintain their respective licenses (CC0 for NASA data, various for PMC content).

## 🏆 Challenge Alignment

**"Build a Space Biology Knowledge Engine" Requirements:**

✅ **Summarization**: RAG-powered Quick Answers with citations  
✅ **AI/RAG**: Evidence-based reader with confidence scoring  
✅ **Knowledge Graphs**: Interactive graph with provenance  
✅ **Dashboard**: 7-page exploration interface  
✅ **NASA Data Integration**: 4 real data source connectors  
✅ **Publications**: PMC and OSDR paper integration  
✅ **Export**: PDF and JSON export capabilities  

---
