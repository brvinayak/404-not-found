# WarehouseIQ

WarehouseIQ is a logistics planning application for exploring demand data and
optimizing warehouse locations. It includes:

- A React frontend built with Vite
- A FastAPI backend for CSV uploads, warehouse optimization, analytics, and
  scenario simulation
- Interactive maps, charts, optimization controls, and results tables

## Project structure

```text
.
├── backend/
│   ├── app/              # FastAPI application, routes, services, and algorithms
│   ├── tests/            # Backend tests and sample CSV fixture
│   └── requirements.txt
├── public/               # Static frontend assets and sample data
├── src/                  # React application
├── package.json
└── vite.config.js        # Frontend development server and API proxy
```

## Prerequisites

Install the following before starting:

- Node.js 18 or newer and npm
- Python 3.10 or newer
- Git (optional, for cloning the repository)

## Quick start

The frontend and backend run as two separate processes. Open two terminals in
the repository root and follow the steps below.

### 1. Start the backend

From the repository root:

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**macOS/Linux**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend is now available at <http://localhost:8000>.

Verify that it is running by opening <http://localhost:8000/health>. The
interactive API documentation is available at
<http://localhost:8000/docs>, and the alternative ReDoc documentation is at
<http://localhost:8000/redoc>.

If PowerShell prevents activation of the virtual environment, run the
following once in a PowerShell terminal with the appropriate permissions:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 2. Start the frontend

Open a second terminal at the repository root (not in `backend`) and run:

```powershell
npm install
npm run dev
```

The frontend is now available at <http://localhost:5173>.

The Vite development server proxies the frontend's `/upload`, `/optimize`,
`/analytics`, `/simulate`, `/health`, and `/api/*` requests to the backend at
`http://localhost:8000`. Keep the backend terminal running while using the
frontend.

### 3. Use the application

1. Open <http://localhost:5173>.
2. Go to the upload page and select a CSV file.
3. Run the optimization after the upload has been accepted.
4. Review the warehouse assignments, metrics, charts, and map results.

Uploaded datasets must be CSV files containing `Latitude` and `Longitude`
columns (headers are case-insensitive; aliases such as `lat`, `lon`, and
`lng` are also supported). Latitude values must be between -90 and 90, and
longitude values must be between -180 and 180. The optional `Area` and
`Orders` columns are supported and are populated when omitted. The sample
dataset at
[`public/bengaluru-demand.csv`](./public/bengaluru-demand.csv) can be used to
try the upload flow.

## Backend API

The backend exposes the following main endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Check service health |
| GET/POST | `/upload` | Inspect upload status or upload a demand CSV |
| GET/POST | `/optimize` | Inspect optimization status or run optimization |
| GET | `/analytics` | Retrieve logistics analytics |
| POST | `/simulate` | Run a scenario simulation |
| GET | `/docs` | OpenAPI/Swagger documentation |

When calling the backend directly, use `http://localhost:8000`. From the
frontend development server, use the proxied paths without the host name.

## Running tests

Activate the backend virtual environment, then run the backend test suite from
the repository root:

**Windows PowerShell**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest
```

**macOS/Linux**

```bash
cd backend
source .venv/bin/activate
python -m pytest
```

## Production build preview

To create and locally preview the frontend production build:

```powershell
npm run build
npm run preview
```

`npm run preview` serves the generated frontend build locally. The backend
still needs to be started separately when API functionality is required.

## Configuration

The backend has sensible development defaults:

- Host: `0.0.0.0`
- Port: `8000`
- Environment: `development`
- Debug/reload: enabled when using the application defaults

Optional backend settings can be placed in `backend/.env`, including
`APP_NAME`, `APP_ENV`, `DEBUG`, `HOST`, `PORT`,
`DEFAULT_MAX_RADIUS_METERS`, `DEFAULT_MAX_CLUSTER_SIZE`, `DEFAULT_MIN_POINTS`,
and `DEFAULT_DBSCAN_EPS_METERS`.

## Troubleshooting

- **Frontend cannot reach the API:** confirm the backend is running on port
  `8000` and that the frontend was started with `npm run dev`.
- **Port already in use:** stop the process using port `5173` or `8000`, or
  change the corresponding Vite/backend configuration.
- **CSV upload is rejected:** confirm the file ends in `.csv` and contains
  valid `latitude` and `longitude` columns.
- **Python imports fail:** make sure the backend virtual environment is
  activated and dependencies were installed from
  `backend/requirements.txt`.
