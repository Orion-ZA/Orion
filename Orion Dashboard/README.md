# Orion – Hiking Dashboard (CRA)

A Create React App scaffold for Orion: a crowd-sourced hiking trails dashboard. Includes a responsive navbar with burger menu, a simple dashboard, placeholder pages, and a footer.

## Features
- Responsive Navbar with burger menu (mobile)
- Dashboard landing with quick links
- Pages: Trail Explorer, Trail Submission, Reviews & Media, MyTrails, Alerts & Updates
- Simple, dark theme styling with utility classes

## Run locally

```cmd
npm install
npm start
```

Build for production:

```cmd
npm run build
```

## Structure
- `src/components/Navbar.*` – Top nav with burger menu
- `src/components/Footer.*` – Footer links
- `src/pages/*` – Route pages (placeholders for now)
- `src/App.js` – Routes and app shell

You can adapt each page to call real APIs later: Trail API, User Contribution API, Search & Filter, Favourites, Alerts.
