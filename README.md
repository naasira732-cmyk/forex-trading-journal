# Forex Trading Journal & Backtesting Dashboard

A professional-grade, private full-stack **Forex Trading Journal and Backtesting Management System** built with **Node.js, Express.js, MySQL, React.js, and Tailwind CSS**.

The system strictly adheres to the principle: **Store the trader's data and transform that data into actionable historical performance information without third-party chart or UI bloat.**

---

## 🚀 Key Features

### 1. Dashboard Overview & Real-Time Equity Curve
* **Live Mathematical Calculation**: Win rate, net profit, profit factor, average win, average loss, realized risk/reward, and maximum drawdown calculated directly from stored MySQL trade records.
* **Pure SVG Equity Curve**: Custom responsive SVG chart displaying trade-by-trade balance progression, peak baseline, and hover tooltip inspector.
* **Empty State Handling**: Gracefully handles new accounts without displaying misleading 0% statistics.

### 2. Trade Journal with Advanced Filtering & Search
* Comprehensive tabular journal with columns: ID, Date, Pair, Direction (BUY/SELL), Timeframe, Session, Strategy, Entry, SL, TP, Exit, Risk %, Risk/Reward, Result (WIN/LOSS/BREAK EVEN), P/L, Notes, and Quick Actions.
* Multi-field filtering by date range, pair, direction, strategy, session, timeframe, result, and free-text search across setups, entry reasons, exit reasons, mistakes, and notes.

### 3. Trade Entry & Deep Post-Trade Review
* **Add / Edit Form**: Captures execution parameters with live 1:X R:R calculation, lot size, risk %, and invalidation levels.
* **Psychological Review Questionnaire**:
  * *What was the setup?*
  * *Why did I enter? (Entry Reason)*
  * *What happened? (Exit Reason)*
  * *What mistake did I make? (Execution / Psychology)*
  * *What did I learn? (Lesson Learned)*

### 4. Backtesting Laboratory & Review System
* Track historical backtesting sessions with sample size, wins, losses, break evens, win rate, total R, average R, and maximum simulated drawdown.
* Detailed qualitative review section documenting: *What worked*, *What failed*, *Common mistakes*, *Strategy observations*, *Improvements*, and *Final conclusion*.

### 5. Strategy Playbook
* Codify distinct setups (e.g., *Liquidity Sweep + FVG*, *London Breakout*, *Order Block & Market Structure Shift*, *Daily Key Level Rejection*).
* Document entry rules, exit rules, risk parameters, suitable sessions, and timeframes.
* View all journal trades executed under each specific strategy.

### 6. Performance Analytics Engine
* **Pair Breakdown**: Total trades, win rate, gross winnings/losses, and net result per pair (EUR/USD, GBP/USD, XAU/USD, USD/JPY, etc.).
* **Strategy Breakdown**: Trade count and expectancy by setup.
* **Session Breakdown**: Compare London, New York, Asian, and Overlap performance.
* **Timeframe Breakdown**: Compare 1M, 5M, 15M, 1H, 4H, and Daily timeframes.

### 7. Interactive Trading Calendar
* Monthly calendar grid displaying trade count, wins, losses, and net P/L for every calendar day.
* Click any trading day to reveal an instant drill-down of all executions taken on that date.

### 8. User Security & Privacy
* Multi-user architecture with strictly isolated data access (`WHERE user_id = ?`).
* Bcrypt-hashed password storage and JWT authentication with session timeout handling.
* Starting balance configuration with dynamic account balance reconciliation.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (v18), Tailwind CSS (Dark Trading Theme)
* **Backend**: Node.js (v25), Express.js
* **Database**: MySQL (MariaDB 10.4 / InnoDB)
* **Architecture**: Decoupled REST API + SPA, connection pooling with prepared statements.

---

## 🔑 Demo Access Credentials

To test the system immediately with realistic Forex trading data:

* **URL**: [http://localhost:5001](http://localhost:5001) (Production Full-Stack) or [http://localhost:3000](http://localhost:3000) (Vite Dev Server)
* **Email**: `trader@forex.com`
* **Password**: `password123`

---

## ⚙️ Running Locally

### Prerequisites
* Node.js (>= 18)
* MySQL / MariaDB (listening on port 3306)

### 1. Database Setup
```sql
CREATE DATABASE IF NOT EXISTS forex_trading_journal;
```
*(The backend automatically creates all required tables and indexes upon launch).*

### 2. Backend Startup
```bash
cd backend
npm install
npm start
```
*The server will run on `http://localhost:5001`.*

### 3. Frontend Startup (Optional Development Mode)
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server will run on `http://localhost:3000` with API proxy to port 5001.*

---

## 📡 REST API Endpoints

### Authentication
* `POST /api/auth/signup` - Register user
* `POST /api/auth/login` - Authenticate & receive JWT
* `POST /api/auth/logout` - Logout
* `GET  /api/auth/me` - Current user profile & live calculated balance
* `PUT  /api/auth/profile` - Update profile & starting capital

### Trades
* `GET    /api/trades` - Filtered & searched trade list
* `GET    /api/trades/:id` - Single trade report & analysis
* `POST   /api/trades` - Record new trade
* `PUT    /api/trades/:id` - Update existing trade
* `DELETE /api/trades/:id` - Delete trade (updates equity curve)

### Strategies
* `GET    /api/strategies` - All strategies with win rate metrics
* `GET    /api/strategies/:id` - Strategy details & linked trades
* `POST   /api/strategies` - Create strategy
* `PUT    /api/strategies/:id` - Update strategy
* `DELETE /api/strategies/:id` - Delete strategy

### Backtesting
* `GET    /api/backtesting` - List backtesting sessions
* `GET    /api/backtesting/:id` - Session details & qualitative review
* `POST   /api/backtesting` - Record backtesting session
* `PUT    /api/backtesting/:id` - Update session & review
* `DELETE /api/backtesting/:id` - Delete backtesting session

### Analytics & Calendar
* `GET /api/analytics/overview` - Complete account metrics & equity curve
* `GET /api/analytics/pairs` - Breakdown by currency pair
* `GET /api/analytics/strategies` - Breakdown by strategy
* `GET /api/analytics/sessions` - Breakdown by market session
* `GET /api/analytics/timeframes` - Breakdown by chart timeframe
* `GET /api/analytics/calendar` - Monthly calendar heatmap & day drill-down
