# Release checklist
- [ ] Test place lookup with multiple known locations.
- [ ] Confirm backend errors are shown clearly in the UI.
- [ ] Test responsive layout on desktop and mobile widths.
- [ ] Add a real transit provider / GTFS feed before claiming live bus routes.
- [ ] Configure OPENAI_API_KEY only in backend environment secrets if using an LLM.
- [ ] Configure CORS for the production frontend domain before deployment.
- [ ] Replace development API URL with production backend URL using VITE_API_URL.
- [ ] Never commit API keys or user location data.
- [ ] Test privacy, consent, and safety messaging.
