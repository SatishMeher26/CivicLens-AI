# CivicLens AI — AI-Powered Urban Civic Issue Mapping, Reporting & Intelligence Platform

> **From Citizen Complaints to Civic Intelligence.**  
> Built by **Team VisionX**

---

## 1. Executive Product Overview

**CivicLens AI** is an end-to-end civic-tech intelligence and workflow platform designed for municipal corporations and citizens. It converts individual, unstructured citizen complaints into structured, geocoded, actionable civic intelligence.

Rather than acting merely as another passive complaint portal, CivicLens AI bridges the complete operational lifecycle:
```
Citizen Grievance Submission (GPS / Manual + Optional Photo)
  ↳ Plain-English AI Category Suggestion (Human-Overridable)
  ↳ Multi-Signal Semantic & Spatial Duplicate Detection
  ↳ Transparent Civic Impact & Urgency Scoring (Explainable Factors)
  ↳ Intelligent Department Routing Matrix
  ↳ Authority Priority Queue & Operational Dispatch
  ↳ Field Remediated Work & Resolution Proof Attachment
  ↳ Authoritative Verification & Sign-Off (Human Reviewer Decision)
  ↳ Citizen Feedback & Satisfaction Rating
  ↳ Spatio-Temporal Recurrence & Chronic Hotspot Intelligence
```

---

## 2. Key Usability & UX Optimizations (Non-Technical Friendly)

1. **Plain-English Language & Clear Labels:**
   - Jargon like *"Spatio-Temporal Chronic Recurrence Defect"* replaced with intuitive terms like *"Repeated Problem Spot (reported 3 times in this area)"*.
   - Technical status labels mapped to everyday municipal progress steps (*Received* $\to$ *In Review* $\to$ *Assigned to Crew* $\to$ *Work in Progress* $\to$ *Inspection Pending* $\to$ *Resolved*).
   - Priority levels clearly labeled with urgency context (*Urgent Hazard*, *High Urgency*, *Standard*, *Low Priority*) with transparent tooltips explaining that scores are planning estimates, not emergency guarantees.

2. **Citizen Portal Experience:**
   - **Step-by-Step Reporting Wizard:** 3 clean, accessible steps (*What happened?* $\to$ *Where is it?* $\to$ *Photos & Contact*).
   - **GPS Location Detection:** One-click `"Use My Current Location"` with browser geolocation API, alongside neighborhood preset chips and manual address inputs.
   - **Flexible Photo Upload:** Supports real device file uploads via camera/gallery (with instant image preview) and optional sample presets for testing. Photos are clearly marked as optional.
   - **Privacy Protection Guarantee:** Explicit citizen privacy banner guaranteeing contact information is confidential and only used for SMS/email tracking updates.
   - **Friendly Duplicate Warnings:** Informs citizens when an issue was reported within 20 meters, offering 1-click community upvoting instead of duplicate tickets.
   - **Neighborhood Quick-Filters:** Chips to quickly filter the feed by local wards (Shivajinagar, Kothrud, Baner, Aundh, Hinjawadi, etc.).

3. **Authority Desk Usability:**
   - **Dedicated Workflow Queue Tabs:**
     - `All Issues`: Full searchable table with multi-criteria filtering.
     - `Action Queue: Urgent`: Filtered to urgent safety hazards needing rapid assignment.
     - `Duplicates to Review`: Dedicated workbench comparing candidate duplicates side-by-side.
     - `Verify Completed Work`: Inspection queue with before/after photos and reviewer approval buttons.
     - `Repeated Problem Spots`: Flags chronic infrastructure failure clusters requiring engineering overhauls.
   - **AI Transparency & Human Decision Policy:** Clear banner reinforcing that all AI suggestions are advisory decision-assistance; human staff retain complete authority to assign, adjust priority, or dismiss recommendations.

---

## 3. Technology Stack

- **Backend:** Python 3.10+, FastAPI 0.110+, Pydantic v2, Scikit-learn, Uvicorn, Pytest.
- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS, Lucide Icons, Leaflet 1.9, Recharts.
- **Geospatial:** Geodesic Haversine spatial math, Leaflet OpenStreetMap tiles, Dynamic multi-intensity heatmaps.
- **Architecture:** Modular Monolith with zero circular dependencies.

---

## 4. Quick Start & Execution

### Option A: Launch Single Unified Server (Recommended)
FastAPI serves both the REST APIs (`/api/v1`) and the compiled Web UI (`/`) on port 8000:
```powershell
# From the project root:
.\start_server.bat
```
- Web Application: **http://127.0.0.1:8000**
- Interactive Swagger API Docs: **http://127.0.0.1:8000/docs**
- Health Check: **http://127.0.0.1:8000/api/v1/health**

### Option B: Frontend Hot-Reload Development Server
```powershell
# Terminal 1 (Backend):
cd backend
python -m uvicorn app.main:app --port 8000 --reload

# Terminal 2 (Frontend Dev Server):
cd frontend
cmd.exe /c npm run dev
```
Open **http://localhost:5173** (Vite proxies all `/api` requests to port 8000).

### Option C: Run Automated Tests
```powershell
.\run_tests.bat
# Or manually:
cd backend
python -m pytest tests/test_ai_and_lifecycle.py -v
```

---

## 5. Demonstration Walkthrough Scenario

Evaluators can follow this step-by-step workflow:

1. **Citizen Grievance Submission:**
   - Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) and click **Report a Problem**.
   - Type: `Deep pothole on 100 Feet Road causing vehicle accidents`.
   - Watch the **Smart Category Suggestion** predict *Roads & Public Footpaths* ($92\%$ match) with clear explanation.
   - Click **Use My Current Location** to test GPS detection or select a neighborhood preset.
   - Observe the **Similar Report Found Nearby** banner if a report exists within 20m.
   - Attach a photo (from device or quick sample) and click **Submit Report Now**.
   - Note the assigned tracking token (e.g. `TRK-...`) and ticket code (e.g. `CVL-...`).

2. **Authority Triage & Dispatch:**
   - Switch role to `Municipal Operator` in the top-right **Demo Role Switcher**.
   - Navigate to **Authority Desk**.
   - Click the **Action Queue: Urgent** tab to view critical hazards.
   - Click **Assign to Municipal Department** (`UserPlus` icon). Review the suggested division (*Roads & Public Infrastructure Division*) and confirm assignment. Status transitions to `assigned`.

3. **Mobilization & Field Remediation:**
   - Click **Change Status** (`ArrowRightLeft` icon) and transition to `in_progress`.

4. **Resolution Proof Submission & Reviewer Verification:**
   - Switch role to `Quality Reviewer`.
   - Click the **Verify Completed Work** tab.
   - Click **Verify** on issue `CVL-2026-103`.
   - Inspect the side-by-side before/after photographic evidence and the advisory completeness score ($88\%$).
   - Input reviewer remarks and click **Approve & Mark Resolved**.

5. **Citizen Tracking & Feedback:**
   - Click **Track by Code or Phone**, input `CVL-2026-103`.
   - View the 5-stage progress bar showing *Resolved & Closed*.
   - Rate the repair (1 to 5 stars) and submit satisfaction remarks.

6. **GIS Intelligence & Chronic Defect Analysis:**
   - Navigate to **GIS Intelligence** to view the live pin markers and toggle the **Heatmap Active** button.
   - Navigate to **Analytics & Trends** to view Recharts workload distributions and the **Spatio-Temporal Chronic Recurrence Hotspots** table.

---

## 6. Subsystem Verification & Test Evidence

All 11 unit and integration tests executed cleanly:
```
tests/test_ai_and_lifecycle.py::test_classification_roads_pothole PASSED
tests/test_ai_and_lifecycle.py::test_classification_drainage_flooding PASSED
tests/test_ai_and_lifecycle.py::test_classification_streetlighting PASSED
tests/test_ai_and_lifecycle.py::test_classification_ambiguous_fallback PASSED
tests/test_ai_and_lifecycle.py::test_duplicate_detection_nearby_same_defect PASSED
tests/test_ai_and_lifecycle.py::test_duplicate_detection_distant_different_location PASSED
tests/test_ai_and_lifecycle.py::test_priority_scoring_critical_factors PASSED
tests/test_ai_and_lifecycle.py::test_priority_scoring_low_risk PASSED
tests/test_ai_and_lifecycle.py::test_routing_matrix PASSED
tests/test_ai_and_lifecycle.py::test_state_transitions_valid_and_invalid PASSED
tests/test_ai_and_lifecycle.py::test_e2e_api_flow PASSED
======================== 11 passed in 1.84s ========================
```
