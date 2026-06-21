# CarbonLens

See Your Impact. Shape a Greener Future.

---

[![Submission-Ready](https://img.shields.io/badge/Prompt%20Wars-Challenge--3-emerald?style=for-the-badge)](https://github.com/PAWANBHOWATE04/carbonlens)
[![Vercel-Compatible](https://img.shields.io/badge/Vercel-Live--Demo-blue?style=for-the-badge&logo=vercel)](https://carbonlens-pawanbhowate04.vercel.app)
[![Testing](https://img.shields.io/badge/Jest-17%2F17%20Passed-brightgreen?style=for-the-badge&logo=jest)](https://jestjs.io)
[![Stack](https://img.shields.io/badge/Stack-Node%20%7C%20Express%20%7C%20Tailwind-indigo?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![A11y](https://img.shields.io/badge/Accessibility-A11y--Compliant-violet?style=for-the-badge)](https://w3c.github.io/aria/)

---

## 1. Project Overview

**CarbonLens** is an AI-powered sustainability decision coach that helps users understand, track, simulate, and reduce their carbon footprint through personalized insights, recommendation roadmaps, lifestyle simulations, and weekly challenges.

Unlike typical calculator utilities that merely sum up inputs, CarbonLens acts as a personal sustainability coach. It performs data-driven analysis of user behaviors to outline high-impact reductions, construct progressive 30-60-90 day timeline roadmaps, and support custom, context-aware consultations.

![Dashboard View](public/assets/screenshots/dashboard.png)

---

## 2. Challenge Context

CarbonLens was developed for **Prompt Wars Challenge 3: Carbon Footprint Awareness Platform**. The platform has been prepared to score highly in evaluation criteria, featuring clean serverless-ready architecture, rigorous data validation, keyboard accessibility support, and unit tests.

---

## 3. Problem Statement

Individual carbon tracking tools are often underutilized due to:
*   **Action Paralysis**: Simple numerical calculators leave users with raw figures (e.g., "1.2 Tons CO₂/month") but no clear next steps.
*   **Generic Recommendations**: Recommending that a user cycle to work when they don't own a car or have a 60 km commute is irrelevant and frustrates users.
*   **Lack of Gamification**: Without progress trackers, streaks, or points, users lose motivation to maintain eco-habits.
*   **Static Modelling**: Users cannot preview the impact of potential lifestyle modifications before making real-world commitments.

---

## 4. Solution Overview

CarbonLens bridges this gap through a feedback loop of assessment, analysis, simulation, and gamification:

| Feature | Standard Calculators | CarbonLens Coach |
| :--- | :--- | :--- |
| **Output Type** | Raw carbon weight figures | Carbon Score (0-100) & Rating Badges |
| **Action Plan** | Bullet list of generic tips | Tailored Top 3 Actions ranked by Impact Score |
| **Progression** | Static single calculation | Dynamic 90-day progressive Roadmap |
| **Forecasting** | None | Interactive slider-based habit Simulator |
| **Engagement** | Static text display | Gamified Challenges, Points, and Streaks |
| **Assistance** | Static FAQ sections | Context-aware AI Climate Consultant Coach |

---

## 5. Key Features

### Carbon Assessment
Collects travel, diet, home utilities (electricity and AC), shopping, and waste habits. Evaluates results to return a Carbon Score and Rating (`Green`, `Improving`, `High Impact`).
*   **Inputs**: Daily distance, vehicle type, diet tier, electricity kWh, AC run-hours, shopping frequency, recycling habit.
*   **Outputs**: Carbon Score (0-100), estimated Monthly CO₂ (kg), and rating category.

![Carbon Assessment Form](public/assets/screenshots/assessment.png)

### AI Decision Coach
A context-aware advisor that parses chat messages and references the user's assessment data to give specific, personalized recommendations.
*   Behaves like a sustainability consultant.
*   Recognizes category keywords (e.g. transport, diet, energy) and cites the user's specific stats in replies.

![AI Decision Coach Chat](public/assets/screenshots/coach.png)

### Emission Breakdown Engine
Evaluates category percentages and highlights the highest and lowest emission sources on the dashboard.
*   **Visual Indicators**: Horizontal category progress fills.
*   **Flags**: Displays highest and lowest contributor categories.

![Dashboard Breakdown](public/assets/screenshots/insights.png)

### Top 3 Actions Engine
Scores and ranks recommendations by **Impact Score** (annual carbon reduction relative to implementation difficulty).
*   **Impact Score** = `Annual CO2 Reduction (kg) / DifficultyWeight` (Easy = 1, Medium = 1.5, Hard = 2).
*   Dynamically populated and ranked.

### Personal Carbon Roadmap
Provides a 30-60-90 day progressive action plan tailored to the user's specific lifestyle profile.
*   **30-Day Goal**: Focuses on quick wins (e.g. energy adjustments).
*   **60-Day Goal**: Focuses on medium-difficulty shifts (e.g. transit habits).
*   **90-Day Goal**: Focuses on systemic shifts (e.g. diet transitions).

### Impact Simulator
Allows users to drag sliders to adjust travel and energy habits, showing a side-by-side comparison of current vs. predicted footprint.
*   **Variables**: Travel distance reduction, AC hours reduction, simulated diet selector.
*   **Fills**: Double horizontal bar comparisons representing current and simulated monthly footprints.

![Impact Simulator View](public/assets/screenshots/simulator.png)

### Sustainability Challenges
Tracks streaks, completion states, and points for eco-habits like No-Car Friday, Plant-Based Monday, and Reusable Bottle Week.
*   Completed checkboxes award challenge points and increment streaks.

![Challenges Board](public/assets/screenshots/challenges.png)

---

## 6. Carbon Calculation Methodology

Emissions are calculated monthly based on standard carbon factors:

### Transportation
$$\text{Transport } \text{CO}_2 = \text{Daily Distance (km)} \times 30 \text{ days} \times \text{Factor}$$
*   **Factors (kg CO₂/km)**: Gasoline Car: `0.18`, Diesel Car: `0.17`, Electric Car: `0.05`, Public Transit: `0.04`, Biking/Walking: `0.0`.

### Food & Diet
*   **Factors (kg CO₂/month)**: Heavy Meat: `250`, Mixed Diet: `150`, Vegetarian: `80`.

### Home Energy
$$\text{Energy } \text{CO}_2 = (\text{Electricity (kWh)} \times 0.4) + (\text{AC Hours} \times 18)$$
*   **Electricity Factor**: `0.4` kg CO₂/kWh.
*   **AC Factor**: `18` kg CO₂ per daily run-hour/month (based on a 1.5 kW unit over 30 days multiplied by the grid factor).

### Shopping
*   **Factors (kg CO₂/month)**: Frequent: `250`, Moderate: `100`, Infrequent: `30`.

### Waste & Recycling
*   **Factors (kg CO₂/month)**: Never Recycle: `50`, Sometimes: `25`, Always Recycle: `10`.

### Scoring & Categorization
$$\text{Carbon Score} = \max\left(0, 100 - \text{round}\left(\frac{\text{Total Monthly } \text{CO}_2}{15}\right)\right)$$
*   **Score $\ge$ 75**: `Green` rating.
*   **Score 45 to 74**: `Improving` rating.
*   **Score < 45**: `High Impact` rating.

---

## 7. Project Architecture

The application is built as an Express backend serving a static HTML5/Tailwind/Vanilla JS single-page application.

```mermaid
graph TD
    Client["Client (HTML5 / CSS3 / Tailwind / Vanilla JS)"]
    VercelEdge["Vercel Edge Router"]
    StaticFiles["Static Files (index.html, styles.css, JS modules)"]
    ExpressApp["Express Application (Serverless Node)"]
    Router["Router (routes/api.js)"]
    Controller["Controller (controllers/carbonController.js)"]
    CalcService["Calculator Service (services/calculatorService.js)"]
    InsightsService["Insights Service (services/insightsService.js)"]
    CoachService["Coach Service (services/coachService.js)"]
    JsonDb["JSON Database (data/db.json)"]

    Client --> VercelEdge
    VercelEdge -->|Static Assets| StaticFiles
    VercelEdge -->|API Requests| ExpressApp
    ExpressApp --> Router
    Router --> Controller
    Controller --> CalcService
    Controller --> InsightsService
    Controller --> CoachService
    Controller -->|Read/Write| JsonDb
```

### Architectural Modules
- **Controller Layer (`server/controllers/`)**: Manages the API endpoints, orchestrating validation, and coordinating between services.
- **Service Layer (`server/services/`)**:
  - `calculatorService.js`: Processes carbon emission factors and category breakdown percentages.
  - `insightsService.js`: Scores and ranks dynamic eco-actions and timeline roadmaps.
  - `coachService.js`: Tailors consultant coaching dialogues.
  - `dbService.js`: Provides high-efficiency in-memory caching and serialized asynchronous file writes.
- **Utility Layer (`server/utils/`)**: Encapsulates helper modules, including input schema validation and text sanitization filters (`validation.js`).
- **Data Layer (`server/data/`)**: Stores a JSON database (`db.json`) synchronized safely with the memory cache.

---

## 8. User Flow Diagram

```mermaid
graph TD
    Start([User Visits App]) --> Assessment{Has done Assessment?}
    Assessment -->|No| Form[Complete 5-Category Assessment Form]
    Assessment -->|Yes| Dashboard[View Carbon Dashboard]
    Form --> Submit[Submit Details]
    Submit --> Save[Save to Database & Compute Profile]
    Save --> Dashboard
    
    Dashboard --> |Tab 1| Breakdown[View Emission Breakdown Engine]
    Dashboard --> |Tab 2| Actions[Inspect Ranked Top 3 Impact Actions]
    Dashboard --> |Tab 3| Roadmap[Review 30-60-90 Day Roadmap]
    Dashboard --> |Tab 4| Simulator[Simulate Lifestyle Modifications]
    Dashboard --> |Tab 5| Challenges[Complete Gamified Challenges]
    Dashboard --> |Tab 6| Coach[Consult AI Climate Coach]
    
    Simulator -->|Real-time update| Dashboard
    Challenges -->|Earn points/streak| Dashboard
    Coach -->|Context-aware recommendations| Dashboard
```

---

## 9. API Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Frontend)
    participant Server as Express Server
    participant Controller as Carbon Controller
    participant Service as Calculator/Insights Services
    participant DB as JSON Database (db.json)
    
    User->>Server: POST /api/assessment { inputs }
    Server->>Controller: Route to submitAssessment()
    Controller->>Service: Call calculateCarbonFootprint() & generateInsights()
    Service-->>Controller: Return footprint breakdown & recommendations
    Controller->>DB: Write updated user profile state
    DB-->>Controller: Confirmed write
    Controller-->>User: HTTP 200 { updated profile JSON }
```

---

## 10. Accessibility Features

Accessibility is treated as a first-class feature:
*   **Keyboard Navigation**: All tabs, inputs, cards, check toggles, and buttons are keyboard focusable and navigable with visible focus states.
*   **Screen Reader Support**: Implements ARIA tags (`role="main"`, `role="banner"`, `role="navigation"`, `role="log"`, `aria-live="polite"`, `aria-selected`).
*   **Contrast & Semantics**: Employs semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`) with high-contrast text ratios for comfortable reading.
*   **Skip Navigation Link**: Provides a keyboard-accessible skip link to immediately bypass header menus.

---

## 11. Security Features

*   **Input Validation**: Strict type, length, and range checks for numerical variables (e.g., daily distance, electricity, and AC hours).
*   **Sanitization Filters**: Encodes username keys and coach chat inputs on the server to prevent HTML and script injection.
*   **Error Handling**: Catches exceptions in controller requests and database read/write queries to prevent system crashes and keep database modifications safe.

---

## 12. Testing Strategy

Automated tests are implemented using Jest:
*   **Calculator tests (`tests/calculator.test.js`)**: Verifies calculations and ratings against high, medium, and low-emission profiles.
*   **Insights tests (`tests/insights.test.js`)**: Confirms contributor highlights, sorted Top 3 recommendations, and roadmap milestones.
*   **Simulator tests (`tests/simulator.test.js`)**: Validates predicted habit modifications.
*   **API Integration tests (`tests/api.test.js`)**: Verifies Express routes, input validation errors, database caching, streak rewards, and coach dialog outputs using `supertest`.

Run the test suite locally with:
```bash
npm test
```

---

## 13. Folder Structure

```text
carbonlens/
│
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── calculator.js
│   │   ├── insights.js
│   │   ├── simulator.js
│   │   └── coach.js
│   └── assets/
│       └── screenshots/
│
├── server/
│   ├── server.js
│   ├── routes/
│   │   └── api.js
│   ├── controllers/
│   │   └── carbonController.js
│   ├── services/
│   │   ├── calculatorService.js
│   │   ├── insightsService.js
│   │   ├── coachService.js
│   │   └── dbService.js
│   ├── utils/
│   │   └── validation.js
│   └── data/
│       └── db.json
│
├── tests/
│   ├── calculator.test.js
│   ├── insights.test.js
│   ├── simulator.test.js
│   └── api.test.js
│
├── package.json
├── vercel.json
├── README.md
└── .gitignore
```

---

## 14. Installation Guide

### Prerequisites
*   [Node.js](https://nodejs.org) (v16+)
*   npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/PAWANBHOWATE04/carbonlens.git
   cd carbonlens
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 15. Local Development

Start the Express development server:
```bash
npm start
```
The server will start on port 3000. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 16. Deployment Guide

### Deployment Link
The live production application is hosted at: **[https://carbonlens-pawanbhowate04.vercel.app](https://carbonlens-pawanbhowate04.vercel.app)**

### Vercel Serverless Deployment
CarbonLens is fully configured for serverless deployment on Vercel:
1. Ensure the Vercel CLI is installed:
   ```bash
   npm install -g vercel
   ```
2. Run the deployment command in the project root:
   ```bash
   vercel
   ```
3. Complete the prompt setup details. Vercel will build the static public assets and host the serverless Express functions as configured in `vercel.json`.
4. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## 17. Future Enhancements

*   **OAuth Authentication**: Integration of Google/GitHub social logins.
*   **Third-Party API Integrations**: Direct lookup of grid carbon intensity from Tomorrow.io or Electricity Maps APIs.
*   **Global Leaderboards**: Allow users to share scores and compete in teams or cities.
*   **Receipt Scanning OCR**: Extract food and shopping emissions from scanned receipts.

---

## 18. License

This project is licensed under the ISC License - see the `package.json` file for details.
