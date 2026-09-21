# JPharma Scheduler

A browser-based monthly staff scheduling portal for creating recurring weekly coverage patterns and printing a clean monthly calendar.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Workflow

1. Add your employees in the **Add your employees** card.
2. Choose one start time for each employee.
3. Click **Add schedule to calendar**. The schedule repeats automatically Monday–Friday in the current month and future months.
4. Click any calendar day to change a time, mark someone off, remove someone, or add an employee for that day.
5. Use **Print / Save PDF** to print the schedule or save it as a PDF from the browser dialog.

Saved schedules, example data, custom weekday rules, printed titles, notes, and reset controls are available under **More options** for users who need them.

The active workspace and saved templates are stored in the current browser with `localStorage`. There is no server, sign-in, database, or schedule history.

## Deploy to Vercel

Import this project into Vercel. Vercel will detect Vite automatically; use `npm run build` as the build command and `dist` as the output directory if prompted.

### Temporary suspension screen

Set the Vercel Production environment variable `VITE_SITE_SUSPENDED` to `true` and redeploy to show the full-site suspension screen. Set it to `false` (or remove it) and redeploy to show the scheduler again. Because this is a Vite build variable, a new deployment is required after changing it.
