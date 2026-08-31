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
2. Enter the printed schedule title.
3. Use **Quick setup for the team** to choose the repeating weekdays and set each employee’s time once. The schedule automatically appears in the selected month and any other month you choose.
4. Use the weekly pattern tabs for special weekday rules, such as Friday coverage or days off.
5. Choose any month and year.
6. Click a calendar date to create a one-off override.
7. Use **Print / Save PDF** to print the schedule or save it as a PDF from the browser dialog.

The active workspace is saved in the current browser with `localStorage`. There is no server, sign-in, database, or schedule history.

## Deploy to Vercel

Import this project into Vercel. Vercel will detect Vite automatically; use `npm run build` as the build command and `dist` as the output directory if prompted.
