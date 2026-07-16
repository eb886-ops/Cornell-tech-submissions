# Meet in the Middle

A fullstack NYC meetup planner: enter addresses for up to 5 people and find a fair
meeting spot, comparing driving vs. subway + walking. Uses live MTA GTFS-RT service
alerts, real subway track geometry (not straight lines) for transit legs, and MTA
line colors throughout the map, directions, and delay UI.

**Live demo:** [https://meetinthemiddle.pplx.app](https://meetinthemiddle.pplx.app)

## Stack

- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Leaflet
- Backend: Express + SQLite (Drizzle ORM)
- Data: MTA static GTFS (stations + subway track shapes), MTA GTFS-RT (live alerts),
  Mapbox (geocoding/autocomplete/directions)

## Running locally

```bash
npm install
npm run build
NODE_ENV=production node dist/index.cjs
```

The app expects Mapbox API access via a reverse proxy, configured through these
environment variables (set by the Perplexity Computer sandbox when this project is
run there):

- `CUSTOM_CRED_API_MAPBOX_COM_URL`
- `CUSTOM_CRED_API_MAPBOX_COM_TOKEN`

To run outside that sandbox, point these at your own Mapbox proxy or adapt
`server/mapbox.ts` to call the Mapbox API directly with your own token.

Note: this repository's GitHub Pages workflow only builds and serves the static
frontend (`npm run build` output) — it cannot run the Express backend. Address
autocomplete, directions, live alerts, and saved routes therefore will not work on
the GitHub Pages copy. The [live demo link](https://meetinthemiddle.pplx.app) above
runs the full app with a working backend.
