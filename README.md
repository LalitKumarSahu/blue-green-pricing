# Blue-Green Pricing API with React Frontend

A modular backend service paired with a React frontend application demonstrating blue-green deployment routing for a pricing page.

## 🎯 Features

### Backend
- **Multiple Routing Strategies**: Percentage-based, IP-based, Header-based, Cookie-based
- **Sticky Sessions**: Consistent user experience across requests
- **Configurable Rules**: Easy configuration via JSON and environment variables
- **Request Logging**: Detailed logging of routing decisions
- **Health Checks**: Monitor system status and version availability
- **Statistics**: Track version distribution and routing patterns

### Frontend
- **Dynamic Pricing Display**: Automatically fetches and displays pricing based on backend routing
- **Responsive Design**: Mobile-friendly pricing cards and layouts
- **Debug Mode**: Built-in debugging tools (Ctrl+D to toggle)
- **Error Handling**: Graceful error states with retry functionality
- **Loading States**: Smooth loading animations

## 📁 Project Structure

```
blue-green-pricing/
├── backend/
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Request handlers
│   │   ├── data/                # Pricing JSON files
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # Data models
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/               # Helper functions
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── server.js                # Main server file
└── frontend/
    ├── src/
    │   ├── components/          # React components
    │   ├── services/            # API service
    │   ├── hooks/               # Custom React hooks
    │   ├── App.jsx              # Main app component
    │   ├── App.css              # App styles
    │   └── index.js             # Entry point
    ├── public/
    │   └── index.html
    ├── package.json
    └── vite.config.js           # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
Edit `.env` file to customize settings:
```env
PORT=3001
BLUE_PERCENTAGE=70
GREEN_PERCENTAGE=30
ENABLE_HEADER_ROUTING=true
ENABLE_COOKIE_ROUTING=true
ENABLE_IP_ROUTING=true
ENABLE_PERCENTAGE_ROUTING=true
```

4. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

Server will start on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
# or
npm run dev
```

Frontend will start on `http://localhost:3000`

## 🔧 Configuration

### Routing Rules (backend/src/config/routing-rules.json)

```json
{
  "routingRules": {
    "percentage": {
      "enabled": true,
      "blue": 70,
      "green": 30
    },
    "header": {
      "enabled": true,
      "headerName": "X-Version",
      "blueValue": "blue",
      "greenValue": "green"
    },
    "cookie": {
      "enabled": true,
      "cookieName": "pricing-version",
      "maxAge": 86400000
    },
    "ip": {
      "enabled": true,
      "blueIps": ["127.0.0.1"],
      "greenIps": []
    }
  },
  "priority": ["header", "cookie", "ip", "percentage"]
}
```

### Pricing Data

**Blue Version** (`backend/src/data/blue-pricing.json`):
- Starter: $9.99/month
- Professional: $29.99/month
- Enterprise: $99.99/month

**Green Version** (`backend/src/data/green-pricing.json`):
- Basic: $7.99/month
- Premium: $24.99/month
- Business: $79.99/month

## 📡 API Endpoints

### Main Endpoints
- `GET /pricing` - Get pricing data (with routing)
- `GET /pricing/stats` - Get routing statistics
- `GET /pricing/health` - Health check
- `GET /pricing/version/:version` - Force specific version (blue/green)
- `POST /pricing/reset-stats` - Reset statistics

### Testing Routing

**Test with Headers:**
```bash
curl -H "X-Version: blue" http://localhost:3001/pricing
curl -H "X-Version: green" http://localhost:3001/pricing
```

**Force Specific Version:**
```bash
curl http://localhost:3001/pricing/version/blue
curl http://localhost:3001/pricing/version/green
```

**Check Statistics:**
```bash
curl http://localhost:3001/pricing/stats
```

## 🎮 Frontend Usage

### Keyboard Shortcuts
- `Ctrl + D` - Toggle debug panel
- `Ctrl + B` - Force blue version
- `Ctrl + G` - Force green version
- `Ctrl + R` - Refresh data

### Debug Panel
Enable debug mode to see:
- Current version being served
- Routing reason (why this version was chosen)
- Client ID
- Request metadata
- Quick version switching

## 🧪 Testing Blue-Green Deployment

1. **Start both backend and frontend**

2. **Test percentage-based routing**:
   - Open multiple browser tabs/incognito windows
   - You should see different versions based on the configured split

3. **Test sticky sessions**:
   - Refresh the page multiple times
   - You should see the same version (sticky session)

4. **Test header-based routing**:
   - Use browser dev tools to add custom header `X-Version: blue` or `green`

5. **Monitor statistics**:
   - Visit `http://localhost:3001/pricing/stats`
   - Check version distribution

## 📊 Logging

The backend logs every request with:
- Timestamp
- Client IP
- User Agent
- Version served
- Routing reason
- Response time

Example log:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "GET",
  "url": "/pricing",
  "clientIp": "127.0.0.1",
  "version": "blue",
  "routingReason": "percentage-split",
  "responseTime": 45
}
```

## 🏗️ Architecture

### Modular Design
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and routing decisions
- **Models**: Data access and validation
- **Middleware**: Cross-cutting concerns (CORS, logging)
- **Utils**: Reusable helper functions

### Routing Priority
1. Header-based (highest priority)
2. Cookie-based
3. IP-based
4. Percentage-based (default)

## 🔒 Security Features
- Helmet.js for security headers
- CORS configuration
- Request rate limiting ready
- Input validation
- Error handling without stack trace exposure in production

## 📈 Performance
- Response caching for pricing data
- Efficient routing algorithms
- Minimal overhead per request
- Optimized bundle size for frontend

## 🛠️ Development

### Adding New Routing Rules
1. Update `routing-rules.json`
2. Implement logic in `RoutingService.js`
3. Add to priority array
4. Test with different scenarios

### Modifying Pricing Data
1. Edit `blue-pricing.json` or `green-pricing.json`
2. Follow the existing JSON structure
3. Server will automatically reload data

## 🐛 Troubleshooting

**Backend not starting:**
- Check if port 3001 is available
- Verify all dependencies are installed
- Check `.env` file configuration

**Frontend can't connect to backend:**
- Ensure backend is running on port 3001
- Check CORS settings in backend
- Verify API_BASE_URL in frontend

**Always seeing same version:**
- Check if sticky session is enabled
- Clear browser cookies
- Try incognito mode

## 📝 License
MIT

## 👥 Contributors
Your Name

---

Built with ❤️ using Node.js, Express, React, and Vite
