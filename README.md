# JPharma Scheduler

A browser-based monthly staff scheduling portal for creating recurring weekly coverage patterns and printing a clean monthly calendar.

The JPharma Pharmacists Schedule is loaded by default. It repeats Monday–Friday, and the calendar opens on the current month. Elile stays on the schedule with ? instead of an assumed 9:00 AM time. On October 30, 2026, Jonathan is marked OFF.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Workflow

1. Add your employees in the **Add your employees** card.
2. Choose a start time for each employee, or leave it blank to show ? until their time is confirmed.
3. Click **Add schedule to calendar**. The schedule repeats automatically Monday–Friday in the current month and future months.
4. Click any calendar day to set a time, mark someone OFF, mark their time as ? when it is not confirmed, or add an employee for that day. Use **Repeat Mon–Fri** on a person's row to repeat that Time, OFF, or ? status every weekday in every month. One-day exceptions stay separate.
5. Use **Print / Save PDF** to print the schedule or save it as a PDF from the browser dialog.

Saved schedules, example data, custom weekday rules, printed titles, notes, and reset controls are available under **More options** for users who need them.

The active workspace, day-specific changes across months, and saved templates are stored in the current browser with `localStorage`. There is no server, sign-in, database, or shared schedule history. A different browser or device cannot see the first browser’s edits unless they are entered there as well.

## Deploy to Vercel

Import this project into Vercel. Vercel will detect Vite automatically; use `npm run build` as the build command and `dist` as the output directory if prompted.

### Temporary suspension screen

Set the Vercel Production environment variable `VITE_SITE_SUSPENDED` to `true` and redeploy to show the full-site suspension screen. Set it to `false` (or remove it) and redeploy to show the scheduler again. Because this is a Vite build variable, a new deployment is required after changing it.
