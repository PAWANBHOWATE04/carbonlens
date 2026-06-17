# CarbonLens 🌍

> **See Your Impact. Shape a Greener Future.**

CarbonLens is an AI-powered sustainability decision coach web application. It helps individuals understand their carbon footprint, track their environmental impact over time, simulate potential improvements, complete weekly challenges, and receive personalized roadmaps and coaching advice.

---

## Core Features

1. **Carbon Assessment**: Evaluates user habits across Transportation, Diet, Energy, Shopping, and Waste, returning a Carbon Score and rating (`Green`, `Improving`, or `High Impact`).
2. **Emission Breakdown Engine**: Visualizes category percentage allocations and flags high/low-impact sources.
3. **Top 3 Actions Engine**: Dynamically calculates and ranks actions to yield maximum annual CO₂ reductions relative to effort.
4. **Personal Carbon Roadmap**: Provides dynamic 30, 60, and 90-day progressive goals based on current metrics.
5. **Impact Simulator**: Supports interactive slider controls to test habit alterations and view predicted changes.
6. **Sustainability Challenges**: Gamified challenges (e.g. No-Car Friday) with points and streaks.
7. **AI Decision Coach**: Context-aware sustainability assistant that answers questions based on actual user profile data.

---

## Project Structure

```text
carbonlens/
│
├── public/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── calculator.js
│       ├── insights.js
│       ├── simulator.js
│       └── coach.js
│
├── server/
│   ├── server.js
│   ├── routes/api.js
│   ├── controllers/carbonController.js
│   ├── services/
│   │   ├── calculatorService.js
│   │   ├── insightsService.js
│   │   └── coachService.js
│   └── data/db.json
│
├── tests/
│   ├── calculator.test.js
│   ├── insights.test.js
│   └── simulator.test.js
│
└── package.json
```

---

## Setup & Running Locally

### Prerequisites
- Node.js (v16+)
- npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

### Start Server
1. Start the Express server:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`.

### Running Tests
Run automated unit tests using Jest:
```bash
npm test
```
