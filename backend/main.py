import asyncio, os, re, math, time
from datetime import datetime
from pathlib import Path
from typing import Literal, Optional
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(title="RiderFlow Mobility API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

HEADERS = {"User-Agent": "RiderFlow/2.0 (mobility prototype)"}
_nominatim_lock = asyncio.Lock()
_last_nominatim_request = 0.0


def valid_coordinates(latitude: float, longitude: float) -> bool:
    return (
        math.isfinite(latitude)
        and math.isfinite(longitude)
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )


class RouteRequest(BaseModel):
    origin: str = Field(min_length=2, max_length=500)
    destination: str = Field(min_length=2, max_length=500)
    mode: Literal["driving", "walking"] = "driving"
    origin_lat: Optional[float] = Field(default=None, ge=-90, le=90)
    origin_lon: Optional[float] = Field(default=None, ge=-180, le=180)
    destination_lat: Optional[float] = Field(default=None, ge=-90, le=90)
    destination_lon: Optional[float] = Field(default=None, ge=-180, le=180)
    origin_label: Optional[str] = Field(default=None, max_length=500)
    destination_label: Optional[str] = Field(default=None, max_length=500)


class TransitRequest(BaseModel):
    origin_lat: float = Field(ge=-90, le=90)
    origin_lon: float = Field(ge=-180, le=180)
    destination_lat: float = Field(ge=-90, le=90)
    destination_lon: float = Field(ge=-180, le=180)


class AIRequest(BaseModel):
    message: str = Field(min_length=2, max_length=500)
    origin: Optional[str] = None
    destination: Optional[str] = None
    language: Literal["en", "hi"] = "en"

async def search_places(query: str, limit: int):
    async def request_places(search_query: str):
        global _last_nominatim_request
        async with _nominatim_lock:
            delay = 1.0 - (time.monotonic() - _last_nominatim_request)
            if delay > 0:
                await asyncio.sleep(delay)
            try:
                async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
                    response = await client.get("https://nominatim.openstreetmap.org/search", params={
                        "q": search_query, "format": "jsonv2", "limit": limit, "addressdetails": 1,
                        "countrycodes": "in",
                    })
                    response.raise_for_status()
                    data = response.json()
            except httpx.HTTPStatusError as exc:
                raise HTTPException(502, "The place search service is temporarily unavailable. Please try again.") from exc
            except httpx.RequestError as exc:
                raise HTTPException(502, "Could not reach the place search service. Check your connection and try again.") from exc
            except ValueError as exc:
                raise HTTPException(502, "The place search service returned an invalid response. Please try again.") from exc
            finally:
                _last_nominatim_request = time.monotonic()
            if not isinstance(data, list) or any(not isinstance(place, dict) for place in data):
                raise HTTPException(502, "The place search service returned an invalid response. Please try again.")
            return data

    data = await request_places(query)
    if data:
        return data
    relaxed_query = re.sub(r"\b(institute|college|university|school|hospital)\b", " ", query, flags=re.I)
    relaxed_query = re.sub(r"\s+", " ", relaxed_query).strip(" ,")
    if relaxed_query and relaxed_query.casefold() != query.casefold():
        return await request_places(relaxed_query)
    return data


async def geocode(place: str):
    data = await search_places(place, 1)
    if not data:
        raise HTTPException(404, f"Couldn't find “{place}”. Try adding a city or landmark.")
    p = data[0]
    try:
        latitude = float(p["lat"])
        longitude = float(p["lon"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(502, "The place search service returned invalid coordinates. Please try again.") from exc
    if not valid_coordinates(latitude, longitude):
        raise HTTPException(502, "The place search service returned invalid coordinates. Please try again.")
    return {"name": p.get("display_name") or place, "lat": latitude, "lon": longitude}

@app.get("/")
def root():
    return {"service": "RiderFlow Mobility API", "status": "ok", "docs": "/docs"}

@app.get("/api/health")
async def health():
    provider = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b") if provider == "ollama" else os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    llm_ready = bool(os.getenv("OPENAI_API_KEY")) if provider == "openai" else False
    if provider == "ollama":
        try:
            async with httpx.AsyncClient(timeout=2) as client:
                response = await client.get(f"{os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434/v1').rstrip('/').removesuffix('/v1')}/api/tags")
                response.raise_for_status()
                installed_models = response.json().get("models", [])
                llm_ready = any(item.get("name") == model for item in installed_models)
        except (httpx.RequestError, httpx.HTTPStatusError, ValueError, AttributeError):
            llm_ready = False
    return {
        "status": "ok",
        "service": "riderflow-mobility-api",
        "routing": "OpenStreetMap + OSRM",
        "llm_configured": provider == "ollama" or bool(os.getenv("OPENAI_API_KEY")),
        "llm_ready": llm_ready,
        "llm_provider": provider,
        "llm_model": model,
    }

@app.get("/api/places")
async def places(q: str):
    if len(q.strip()) < 2:
        return {"results": []}
    data = await search_places(q.strip(), 5)
    results = []
    for place in data:
        try:
            latitude = float(place["lat"])
            longitude = float(place["lon"])
        except (KeyError, TypeError, ValueError) as exc:
            raise HTTPException(502, "The place search service returned invalid coordinates. Please try again.") from exc
        if not valid_coordinates(latitude, longitude):
            raise HTTPException(502, "The place search service returned invalid coordinates. Please try again.")
        name = place.get("display_name")
        if not isinstance(name, str) or not name.strip():
            raise HTTPException(502, "The place search service returned a result without a name. Please try again.")
        results.append({"name": name, "lat": latitude, "lon": longitude})
    return {"results": results}


@app.get("/api/location/reverse")
async def reverse_location(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
):
    try:
        async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lon, "format": "jsonv2"},
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(502, "The location service could not identify your position.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(502, "Could not reach the location service. Check your connection and try again.") from exc
    if not data.get("display_name"):
        raise HTTPException(404, "Couldn't identify this location. Try entering a nearby landmark.")
    return {"name": data["display_name"], "lat": lat, "lon": lon}


@app.post("/api/route")
async def route(req: RouteRequest):
    if not req.origin.strip() or not req.destination.strip():
        raise HTTPException(422, "Enter both a starting point and destination.")
    if (req.origin_lat is None) != (req.origin_lon is None) or (req.destination_lat is None) != (req.destination_lon is None):
        raise HTTPException(422, "Both coordinates are required for a selected place.")
    origin = (
        {"name": req.origin_label or req.origin, "lat": req.origin_lat, "lon": req.origin_lon}
        if req.origin_lat is not None
        else await geocode(req.origin)
    )
    destination = (
        {"name": req.destination_label or req.destination, "lat": req.destination_lat, "lon": req.destination_lon}
        if req.destination_lat is not None
        else await geocode(req.destination)
    )
    if not valid_coordinates(origin["lat"], origin["lon"]) or not valid_coordinates(destination["lat"], destination["lon"]):
        raise HTTPException(422, "Origin and destination must have valid coordinates.")
    profile = "foot" if req.mode == "walking" else "driving"
    try:
        async with httpx.AsyncClient(timeout=20, headers=HEADERS) as client:
            response = await client.get(
                f"https://router.project-osrm.org/route/v1/{profile}/{origin['lon']},{origin['lat']};{destination['lon']},{destination['lat']}",
                params={"overview": "full", "geometries": "geojson", "steps": "true", "alternatives": "true"}
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(502, "The route service is temporarily unavailable. Please try again.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(502, "Could not reach the route service. Check your connection and try again.") from exc
    except ValueError as exc:
        raise HTTPException(502, "The route service returned an invalid response. Please try again.") from exc
    if not isinstance(data, dict) or data.get("code") != "Ok" or not isinstance(data.get("routes"), list) or not data["routes"]:
        raise HTTPException(422, "No route found for these places. Try different landmarks.")
    routes = []
    for i, rt in enumerate(data["routes"][:3]):
        if not isinstance(rt, dict):
            raise HTTPException(502, "The route service returned invalid route data. Please try again.")
        geometry = rt.get("geometry")
        coordinates = geometry.get("coordinates") if isinstance(geometry, dict) else None
        if not isinstance(geometry, dict) or geometry.get("type") != "LineString" or not isinstance(coordinates, list) or len(coordinates) < 2:
            raise HTTPException(502, "The route service returned incomplete route geometry. Please try again.")
        if any(
            not isinstance(point, (list, tuple))
            or len(point) < 2
            or isinstance(point[0], bool)
            or isinstance(point[1], bool)
            or not isinstance(point[0], (int, float))
            or not isinstance(point[1], (int, float))
            or not valid_coordinates(point[1], point[0])
            for point in coordinates
        ):
            raise HTTPException(502, "The route service returned invalid route coordinates. Please try again.")
        distance_m = rt.get("distance")
        duration_s = rt.get("duration")
        if (
            not isinstance(distance_m, (int, float))
            or not math.isfinite(distance_m)
            or distance_m < 0
            or not isinstance(duration_s, (int, float))
            or not math.isfinite(duration_s)
            or duration_s < 0
        ):
            raise HTTPException(502, "The route service returned invalid distance or duration. Please try again.")
        legs = rt.get("legs")
        if not isinstance(legs, list) or not legs or not isinstance(legs[0], dict):
            raise HTTPException(502, "The route service returned incomplete route details. Please try again.")
        steps = legs[0].get("steps", [])
        if not isinstance(steps, list) or any(not isinstance(step, dict) for step in steps):
            raise HTTPException(502, "The route service returned invalid driving directions. Please try again.")
        step_results = []
        for step in steps[:8]:
            maneuver = step.get("maneuver", {})
            distance = step.get("distance", 0)
            if (
                not isinstance(maneuver, dict)
                or not isinstance(maneuver.get("type", "Continue"), str)
                or not isinstance(distance, (int, float))
                or isinstance(distance, bool)
                or not math.isfinite(distance)
                or distance < 0
            ):
                raise HTTPException(502, "The route service returned invalid driving directions. Please try again.")
            road = step.get("name") or "Unnamed road"
            if not isinstance(road, str):
                raise HTTPException(502, "The route service returned invalid driving directions. Please try again.")
            step_results.append({
                "instruction": maneuver.get("type", "Continue").replace("-", " ").title(),
                "road": road,
                "distance_m": round(distance),
            })
        summary = legs[0].get("summary")
        if summary is not None and not isinstance(summary, str):
            raise HTTPException(502, "The route service returned invalid route details. Please try again.")
        routes.append({
            "id": i + 1,
            "distance_km": round(distance_m / 1000, 1),
            "duration_min": max(1, round(duration_s / 60)),
            "geometry": geometry,
            "summary": summary or ("Recommended route" if i == 0 else "Alternative route"),
            "steps": step_results,
        })
    if not routes:
        raise HTTPException(422, "No route found for these places. Try different landmarks.")
    return {
        "origin": origin, "destination": destination, "mode": req.mode,
        "routes": routes,
        "notice": f"{'Walking' if req.mode == 'walking' else 'Driving'} route estimate from OpenStreetMap/OSRM. It is not a live public-transit itinerary; bus schedules and arrivals need a local transit feed."
    }


def _google_transit_route(route: dict, category: str) -> Optional[dict]:
    duration = route.get("duration")
    if not isinstance(duration, str) or not re.fullmatch(r"\d+(?:\.\d+)?s", duration):
        raise ValueError("The transit provider returned an invalid duration.")
    duration_minutes = float(duration[:-1]) / 60
    if not math.isfinite(duration_minutes) or duration_minutes <= 0:
        raise ValueError("The transit provider returned an invalid duration.")

    legs = route.get("legs")
    if not isinstance(legs, list) or not legs:
        raise ValueError("The transit provider returned an incomplete itinerary.")
    transit_steps = []
    contains_other_transit = False
    for leg in legs:
        if not isinstance(leg, dict) or not isinstance(leg.get("steps", []), list):
            raise ValueError("The transit provider returned invalid itinerary details.")
        for step in leg.get("steps", []):
            if not isinstance(step, dict):
                raise ValueError("The transit provider returned invalid itinerary details.")
            details = step.get("transitDetails")
            if details is None:
                continue
            if not isinstance(details, dict):
                raise ValueError("The transit provider returned invalid transit details.")
            line = details.get("transitLine")
            vehicle = line.get("vehicle") if isinstance(line, dict) else None
            vehicle_type = vehicle.get("type") if isinstance(vehicle, dict) else None
            if not isinstance(vehicle_type, str):
                contains_other_transit = True
                continue
            is_bus = vehicle_type == "BUS"
            is_rail = vehicle_type in {
                "RAIL", "TRAIN", "HEAVY_RAIL", "COMMUTER_TRAIN",
                "HIGH_SPEED_TRAIN",
            }
            if (category == "bus" and is_bus) or (category == "train" and is_rail):
                line_name = line.get("nameShort") or line.get("name") or line.get("nameLong")
                agencies = line.get("agencies", [])
                if not isinstance(agencies, list):
                    raise ValueError("The transit provider returned invalid agency details.")
                agency_names = [
                    agency["name"] for agency in agencies
                    if isinstance(agency, dict) and isinstance(agency.get("name"), str)
                ]
                if not line_name and agency_names:
                    line_name = agency_names[0]
                if line_name is not None and not isinstance(line_name, str):
                    raise ValueError("The transit provider returned an invalid transit line.")
                stop_details = details.get("stopDetails", {})
                if not isinstance(stop_details, dict):
                    raise ValueError("The transit provider returned invalid schedule details.")
                transit_steps.append({
                    "line": line_name or ("Bus service" if is_bus else "Rail service"),
                    "departure_time": stop_details.get("departureTime"),
                    "arrival_time": stop_details.get("arrivalTime"),
                })
            else:
                contains_other_transit = True

    if not transit_steps or contains_other_transit:
        return None

    fare = None
    advisory = route.get("travelAdvisory")
    if advisory is not None:
        if not isinstance(advisory, dict):
            raise ValueError("The transit provider returned invalid fare details.")
        provider_fare = advisory.get("transitFare")
        if provider_fare is not None:
            if not isinstance(provider_fare, dict):
                raise ValueError("The transit provider returned invalid fare details.")
            currency = provider_fare.get("currencyCode")
            units = provider_fare.get("units")
            nanos = provider_fare.get("nanos", 0)
            if (
                isinstance(units, bool)
                or not isinstance(units, (int, str))
                or (isinstance(units, str) and not re.fullmatch(r"-?\d+", units))
                or isinstance(nanos, bool)
                or not isinstance(nanos, int)
                or abs(nanos) >= 1_000_000_000
            ):
                raise ValueError("The transit provider returned invalid fare details.")
            try:
                amount = float(units) + float(nanos) / 1_000_000_000
            except (OverflowError, TypeError, ValueError) as exc:
                raise ValueError("The transit provider returned invalid fare details.") from exc
            if (
                not isinstance(currency, str)
                or not re.fullmatch(r"[A-Z]{3}", currency)
                or not math.isfinite(amount)
                or amount < 0
            ):
                raise ValueError("The transit provider returned invalid fare details.")
            fare = {"currency": currency, "amount": amount}

    first_departure = transit_steps[0]["departure_time"]
    last_arrival = transit_steps[-1]["arrival_time"]
    for value in (first_departure, last_arrival):
        if value is not None:
            if not isinstance(value, str):
                raise ValueError("The transit provider returned invalid schedule details.")
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError("The transit provider returned invalid schedule details.") from exc

    return {
        "duration_min": max(1, round(duration_minutes)),
        "fare": fare,
        "departure_time": first_departure,
        "arrival_time": last_arrival,
        "lines": list(dict.fromkeys(step["line"] for step in transit_steps)),
    }


async def _query_google_transit(
    client: httpx.AsyncClient,
    api_key: str,
    request: TransitRequest,
    category: str,
) -> dict:
    modes = ["BUS"] if category == "bus" else ["TRAIN"]
    payload = {
        "origin": {"location": {"latLng": {"latitude": request.origin_lat, "longitude": request.origin_lon}}},
        "destination": {"location": {"latLng": {"latitude": request.destination_lat, "longitude": request.destination_lon}}},
        "travelMode": "TRANSIT",
        "computeAlternativeRoutes": True,
        "transitPreferences": {"allowedTravelModes": modes},
        "languageCode": "en-IN",
    }
    response = await client.post(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": (
                "routes.duration,routes.travelAdvisory.transitFare,"
                "routes.legs.steps.transitDetails"
            ),
        },
        json=payload,
    )
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict) or not isinstance(data.get("routes", []), list):
        raise ValueError("The transit provider returned an invalid response.")
    options = []
    for route_data in data.get("routes", [])[:4]:
        if not isinstance(route_data, dict):
            raise ValueError("The transit provider returned an invalid itinerary.")
        option = _google_transit_route(route_data, category)
        if option is not None:
            options.append(option)
    return {
        "status": "available" if options else "no_data",
        "options": options,
        "message": "" if options else f"No {category} itineraries were returned for these places and this departure time.",
    }


@app.post("/api/transit/options")
async def transit_options(request: TransitRequest):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        unavailable = {
            "status": "not_configured",
            "options": [],
            "message": "Verified transit itineraries are unavailable. Configure GOOGLE_MAPS_API_KEY on the backend to enable Google Routes API transit results.",
        }
        return {"provider": "Google Routes API", "bus": unavailable, "train": unavailable}

    async def query_category(client: httpx.AsyncClient, category: str) -> dict:
        try:
            return await _query_google_transit(client, api_key, request, category)
        except httpx.TimeoutException:
            return {
                "status": "error",
                "options": [],
                "message": "The transit provider timed out. Try again later.",
            }
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (401, 403):
                message = "The transit provider rejected the key. Check that the Routes API is enabled and the server key is authorized."
            elif exc.response.status_code == 429:
                message = "The transit provider quota was reached. Check the Google Cloud billing and quota settings."
            else:
                message = f"The transit provider returned an error (HTTP {exc.response.status_code}). Try again later."
            return {"status": "error", "options": [], "message": message}
        except httpx.RequestError:
            return {
                "status": "error",
                "options": [],
                "message": "Could not connect to the transit provider. Check the backend network and try again.",
            }
        except (ValueError, TypeError, KeyError, AttributeError):
            return {
                "status": "error",
                "options": [],
                "message": "The transit provider returned incomplete or invalid data.",
            }

    async with httpx.AsyncClient(timeout=15) as client:
        bus, train = await asyncio.gather(
            query_category(client, "bus"),
            query_category(client, "train"),
        )
    return {"provider": "Google Routes API", "bus": bus, "train": train}


def parse_trip(text: str):
    clean = text.strip().strip(" .?!")
    patterns = [
        r"from\s+(.+?)\s+to\s+(.+)",
        r"between\s+(.+?)\s+and\s+(.+)",
        r"take me\s+(?:from\s+)?(.+?)\s+to\s+(.+)",
        r"(?:route|directions?)\s+from\s+(.+?)\s+to\s+(.+)",
        r"(?:go|travel|drive|walk|navigate)\s+from\s+(.+?)\s+to\s+(.+)",
        r"(?:go|travel|drive|walk|navigate)\s+to\s+(.+?)\s+from\s+(.+)"
    ]
    for pattern in patterns:
        m = re.search(pattern, clean, flags=re.I)
        if m:
            if pattern.endswith(r"(.+?)\s+from\s+(.+)"):
                return m.group(2).strip(" ,"), m.group(1).strip(" ,")
            return m.group(1).strip(" ,"), m.group(2).strip(" ,")
    return None, None


def detect_transport_mode(text: str) -> Optional[str]:
    patterns = (
        ("rental", r"\b(rent(?:al|ing)?|car hire|self[- ]drive|rental vehicles?)\b"),
        ("flight", r"\b(flights?|fly|airplanes?|airport|air travel)\b"),
        ("train", r"\b(trains?|railway|rail|express trains?|local trains?)\b"),
        ("bus", r"\b(bus|buses|coach|msrtc)\b"),
        ("bike", r"\b(bikes?|bicycles?|biking|scooters?|two[- ]wheelers?|motorcycles?)\b"),
        ("walking", r"\b(walk|walking|on foot)\b"),
    )
    for mode, pattern in patterns:
        if re.search(pattern, text, re.I):
            return mode
    return None


def smart_answer(message: str, origin: Optional[str], destination: Optional[str]) -> str:
    if re.search(r"\b(safe|safely|safety|emergency|share|trusted contact)\b", message, re.I):
        return (
            "For a safer trip, share your route and expected arrival with someone you trust, "
            "keep your phone charged, and stay aware of your surroundings. If you feel in immediate "
            "danger, contact local emergency services. RiderFlow does not send emergency alerts."
        )
    mode = detect_transport_mode(message)
    trip = f" between {origin} and {destination}" if origin and destination else " in India"
    if mode == "bike":
        return (
            f"For a short local trip{trip}, a two-wheeler may be convenient. Check current bike-taxi "
            "or rental availability in a provider app before relying on it; RiderFlow has no live "
            "bike-service, price, or availability feed. Wear a helmet and use a licensed service."
        )
    if mode == "rental":
        return (
            f"For a vehicle rental{trip}, compare licensed car or two-wheeler providers and check "
            "pickup, drop-off, licence, and one-way conditions before booking. RiderFlow has no live "
            "rental availability or price data."
        )
    if mode == "bus":
        return (
            f"For a bus trip{trip}, check the relevant city or state transport operator for your route. "
            "RiderFlow does not have live bus timetables, arrivals, fares, or interchange data, so "
            "confirm the service with the operator before travelling."
        )
    if mode == "train":
        return (
            f"For rail travel{trip}, check services and confirm the current timetable, running status, "
            "and seat availability through Indian Railways "
            "or IRCTC. RiderFlow cannot verify live train data."
        )
    if mode == "flight":
        return (
            f"For air travel{trip}, check the nearest suitable airports and current airline schedules. "
            "Compare the full journey, including ground transfers. RiderFlow has no live flight, "
            "fare, or seat-availability feed."
        )
    if re.search(r"\b(bus times?|arriv(?:e|es|ed|ing|al|als)|timetable|schedule|fares?|live transit)\b", message, re.I):
        return (
            "Live bus arrivals, timetables, and fares aren't connected in this prototype, so I won't "
            "guess them. Ask me about bike, bus, train, or flight options in India, or request a "
            "road or walking estimate between two places."
        )
    if re.search(r"\b(nearby|nearest|closest)\b", message, re.I):
        return (
            "I can't identify nearby stops without a live place or transit feed. Add a landmark and "
            "city to your trip, or use the map and check the local operator for current stops."
        )
    if origin and destination:
        return (
            f"I found your trip from {origin} to {destination} and filled in the journey fields. "
            "RiderFlow can calculate a road-route estimate or walking directions in India. "
            "We don't have live transit or flight schedules, fares, or availability."
        )
    if re.search(r"\b(hello|hi|hey)\b", message, re.I):
        return "Hi! Ask me about bike, bus, train, or flight options in India, or tell me your starting point and destination."
    return (
        "I can help compare bike, bus, train, and flight options across India, plan a road or "
        "walking route, and share practical safety guidance. Try \"Train from Delhi to Jaipur\", "
        "\"How do I get from Mumbai to Pune?\", or \"Flights from Chennai to Kolkata\". Live schedules, fares, and "
        "availability require operator data and aren't shown here."
    )


@app.post("/api/ai/plan")
async def ai_plan(req: AIRequest):
    message = req.message.strip()
    parsed_origin, parsed_destination = parse_trip(message)
    route_intent = bool(parsed_origin and parsed_destination) or bool(
        re.search(r"\b(route|directions?|navigate|journey|trip|commute)\b", message, re.I)
        or re.search(r"\bhow (?:do|can) i get\b", message, re.I)
    )
    transport_mode = detect_transport_mode(message)
    origin = parsed_origin or (req.origin if route_intent else None)
    destination = parsed_destination or (req.destination if route_intent else None)

    provider = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b") if provider == "ollama" else os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if provider not in {"ollama", "openai"}:
        raise HTTPException(500, "LLM_PROVIDER must be set to 'ollama' or 'openai' in backend/.env.")
    api_key = os.getenv("OPENAI_API_KEY")
    if provider == "openai" and not api_key:
        raise HTTPException(
            503,
            "Online AI is not configured yet. Route planning and saved journeys are still available. "
            "To enable AI, set OPENAI_API_KEY as a server-side environment variable.",
        )
    else:
        llm_url = (
            os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/")
            if provider == "ollama"
            else "https://api.openai.com/v1"
        )
        headers = {"Content-Type": "application/json"}
        if provider == "openai":
            headers["Authorization"] = f"Bearer {api_key}"
        response_language = (
            "The required response language is Hindi. You must write the complete answer in Hindi using Devanagari script, "
            "even when the user's message is in English."
            if req.language == "hi"
            else "The required response language is English. Write the complete answer in English."
        )
        system_prompt = (
            f"{response_language} You are RiderFlow, a concise and safety-conscious travel assistant for journeys across India. "
            "Answer questions about the user's actual origin and destination; do not assume a particular city or state. "
            "Bike, bus, train, flight, and vehicle-rental services vary by location, operator, and date. "
            "Never invent live schedules, fares, rental availability, seat availability, provider coverage, transit interchanges, "
            "or emergency capabilities; direct users to the relevant operator and say live data is not connected. "
            "Do not treat bus, train, or flight requests as road routes. For ordinary route requests, identify the origin and "
            "destination and explain that the app can calculate a road or walking estimate. For safety questions, give practical, "
            "calm advice and say to contact local emergency services for immediate danger. Reply in 2-4 helpful sentences."
        )
        try:
            async with httpx.AsyncClient(timeout=90) as client:
                response = await client.post(
                    f"{llm_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "temperature": 0.2,
                        "max_tokens": 350,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message}
                        ]
                    }
                )
                response.raise_for_status()
                try:
                    answer = response.json()["choices"][0]["message"]["content"]
                except (KeyError, IndexError, TypeError, ValueError) as exc:
                    raise HTTPException(502, "The language model returned an unreadable response.") from exc
                if not isinstance(answer, str) or not answer.strip():
                    raise HTTPException(502, "The language model returned an empty response.")
        except httpx.HTTPStatusError as exc:
            if provider == "ollama" and exc.response.status_code == 404:
                detail = f"Local model '{model}' is not installed. Run 'ollama pull {model}' in a terminal, then try again."
            elif exc.response.status_code == 401:
                detail = "The AI provider rejected the API key. Check OPENAI_API_KEY in backend/.env."
            elif exc.response.status_code == 429:
                detail = "The AI provider rate limit or account quota was reached. Check your provider account and try again."
            else:
                detail = f"The language model rejected the request (HTTP {exc.response.status_code}). Check the model configuration."
            raise HTTPException(502, detail) from exc
        except httpx.ConnectError as exc:
            if provider == "ollama":
                detail = "Cannot reach Ollama. Install and start Ollama, then run 'ollama pull qwen2.5:3b'."
            else:
                detail = "Could not reach the AI service. Check the backend internet connection and try again."
            raise HTTPException(503, detail) from exc
        except httpx.RequestError as exc:
            raise HTTPException(502, "The language model request failed. Check the backend connection and try again.") from exc
    supported_route = transport_mode in (None, "walking")
    return {
        "answer": answer,
        "origin": origin,
        "destination": destination,
        "can_route": bool(route_intent and origin and destination and supported_route),
        "transport_mode": transport_mode,
        "ai_mode": "llm" if provider == "openai" else "ollama",
    }
