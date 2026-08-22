# JPharma Scheduler

A browser-based monthly staff scheduling portal for creating recurring weekly coverage patterns and printing a clean monthly calendar.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Workflow

1. Add team members in the left panel.
2. Build the recurring Sunday–Saturday pattern with employee/time rows and optional notes.
3. Choose any month and year.
4. Click a calendar date to create a one-off override.
5. Use **Print / Save PDF** to print the schedule or save it as a PDF from the browser dialog.

The active workspace is saved in the current browser with `localStorage`. There is no server, sign-in, database, or schedule history.

## Deploy to Vercel

Import this project into Vercel. Vercel will detect Vite automatically; use `npm run build` as the build command and `dist` as the output directory if prompted.
