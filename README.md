# RiderFlow — Mobility companion

A polished React + FastAPI prototype for an AI-powered travel companion with place search across India.

## Requirements
- Python 3.10+
- Node.js LTS (npm included)
- Internet connection for OpenStreetMap place search and OSRM road routing

## Easiest Windows setup
1. Extract the ZIP.
2. Double-click `START_BACKEND.bat`. Keep its terminal open.
3. Double-click `START_FRONTEND.bat`. Keep its terminal open.
4. Open the Vite URL, normally http://127.0.0.1:5173.
5. API documentation: http://127.0.0.1:8000/docs

## Manual setup
Backend terminal:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```
Frontend terminal:
```powershell
cd frontend
npm install
npm run dev
```

## Deploy to Vercel
The existing Vercel project builds from the repository root. `vercel.json` runs `npm --prefix frontend ci`, builds with `npm --prefix frontend run build`, publishes `frontend/dist`, and routes `/api/*` to the single FastAPI entry point at `api/index.py`. The frontend uses `VITE_API_URL` as its public API base; when it is unset, production uses the current site origin, while local development uses `http://127.0.0.1:8000`.

The Vercel deployment includes the FastAPI backend, so no separate Render service is needed for the current configuration. Production uses `LLM_PROVIDER=openai`; without `OPENAI_API_KEY`, free-form online AI requests return a clear unavailable message, while route planning and other features continue to work. To enable AI, add `OPENAI_API_KEY` as a **server-side** Vercel environment variable and redeploy. Never use a `VITE_` prefix for secrets. `GOOGLE_MAPS_API_KEY` is optional and also belongs only in the server-side environment; it enables verified transit itineraries when configured and available. Ollama/Qwen remains a local-development option and is not available to Vercel.

Smart Bus Alerts and voice alerts are sample simulations, not live bus tracking. Arrival reminders require a manual phone check-in; they are not scheduled or sent by RiderFlow. Missed-stop recovery uses browser location and the backend to recalculate a route. Flight, rental, and unverified bus/train prices remain labeled demo estimates. Saved journeys and places stay in the current browser's local storage.

## AI assistant setup
RiderFlow uses **Ollama with a local Qwen 2.5 3B model by default**, so you do not need a paid API key and travel prompts stay on your computer.

1. Install [Ollama for Windows](https://ollama.com/download/windows).
2. Open PowerShell and download the model once: `ollama pull qwen2.5:3b` (about 2 GB).
3. Copy `backend/.env.example` to `backend/.env`. The default `LLM_PROVIDER=ollama` and `OLLAMA_MODEL=qwen2.5:3b` are ready to use.
4. Restart `START_BACKEND.bat` and open RiderFlow.
5. Check `http://127.0.0.1:8000/api/health`. `llm_ready` should be `true`; in the app the assistant badge should say **LOCAL AI**.

If Ollama is installed but not running, start the Ollama app from the Windows Start menu. If the model is missing, run `ollama pull qwen2.5:3b`. The assistant will show a setup error rather than pretend a fallback is a generated model response. For supported hardware, choose a smaller Ollama model by updating `OLLAMA_MODEL` in `backend/.env`.
Assistant replies use the selected website language (English or Hindi). Speech recognition language is selected separately in the voice control.

Optional: to use OpenAI instead, set `LLM_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` in `backend/.env`. API usage may incur charges. Never place an API key in frontend code or commit `backend/.env`; it is excluded by `.gitignore`. Model-generated travel advice does not include live transit or flight feeds and must not be treated as current schedules, fares, or availability.

## Data and important limitations
- Place lookup uses OpenStreetMap Nominatim and supports locations across India.
- Road and walking estimates use the public OSRM demo server; they are estimates, not live traffic guidance. The map draws the recommended route in red and alternatives with a muted dashed line using Leaflet and OpenStreetMap tiles.
- These are public services and have usage policies/rate limits; do not hammer them.
- Current location is requested only after the user selects “Use my location” or confirms the voice/text command; browser location permission is required.
- Place suggestions help select locations before planning; an internet connection is required for suggestions and route calculation.
- Bus and rail itineraries are requested server-side from the [Google Routes API transit endpoint](https://developers.google.com/maps/documentation/routes/transit-route) only when `GOOGLE_MAPS_API_KEY` is configured in `backend/.env`. Follow Google's [Routes API key setup](https://developers.google.com/maps/documentation/routes/get-api-key) and enable billing in the associated Google Cloud project. Transit availability depends on the route and provider coverage; fare is shown only if the API returns one, and provider departure/arrival times are displayed in UTC. These are provider itineraries, not guaranteed live vehicle positions or arrivals. Without a configured key or returned itinerary, the UI explicitly reports that verified transit data is unavailable. Never put this key in frontend configuration or commit it.
- The [Delhi Open Transit Data portal](https://otd.delhi.gov.in/) publishes Delhi-specific static and dynamic transit datasets, but RiderFlow does not currently connect to that portal; it is not a nationwide feed. [GTFS Schedule and GTFS Realtime](https://gtfs.org/documentation/overview/) are standards, not data sources by themselves.
- Flight duration/fares and self-drive rental rates remain synthetic, distance-based demo estimates, not operator results, quotes, or live availability. Each is labeled as a demo estimate. Flight estimates may note when a flight is not recommended for a short trip.
- External links are provided to help check operators, schedules, prices, and availability. RiderFlow does not sell tickets or rentals or make bookings.
- Saved places are stored in the current browser's local storage and are not synced to an account.
- The website interface can be switched between English and Hindi from the header; the selection is saved in the current browser. The speech-language selector is independent and controls voice recognition only.
- RiderFlow can also accept typed or spoken site commands from the assistant, such as “open Safety”, “open Saved Places”, “change website language to Hindi”, “use Hindi for voice”, “save Home at Connaught Place”, or “remove saved place Home”. Confirm before it uses your current location or changes saved places. Route requests such as “plan a route from Delhi to Jaipur” continue through the travel assistant. This prototype only supports the listed command patterns; it does not allow open-ended AI access to arbitrary browser actions.
- Trusted-contact sharing prepares a WhatsApp message for the user to review and send; contacts are not stored by RiderFlow.
- Route-deviation detection, automatic alerts, verified live bus arrivals, and guaranteed transit itineraries are not available in this prototype. Google Routes API transit results require a valid server-side key and regional coverage; GTFS Realtime vehicle positions are not integrated.
- The safety page provides guidance and a share-message helper; it does not dispatch emergency services, send background alerts, or track users continuously.
- Browser voice input depends on microphone permission, the selected language, and the browser's online speech service. English, Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, and Punjabi are selectable. If voice reports a speech-service network error in VS Code's built-in browser, open the local site in desktop Chrome or Edge; speech recognition is provided by the browser, not the local AI model.
- Do not use the prototype as an emergency service.

## Troubleshooting
- Backend: visit http://127.0.0.1:8000/api/health
- API docs: http://127.0.0.1:8000/docs
- If frontend cannot connect, start the backend first and confirm port 8000 is reachable.
- If `npm` is not found, install Node.js LTS and reopen terminals.
