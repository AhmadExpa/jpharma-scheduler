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
3. Choose any month and year.
4. Set up the employee roster and recurring shift times once, then click **Save as template** in the saved templates bar.
5. For a new month, select the saved template to instantly restore the employees and recurring shift times.
6. Click any calendar date, choose **Add slot**, and select the employee and time for a one-off change.
7. For schedules that repeat, use **Quick setup for the team** to set employee times once for selected weekdays.
8. Use the weekly pattern tabs for special weekday rules, such as Friday coverage or days off.
9. Use **Print / Save PDF** to print the schedule or save it as a PDF from the browser dialog.

The active workspace and saved templates are stored in the current browser with `localStorage`. There is no server, sign-in, database, or schedule history.

## Deploy to Vercel

Import this project into Vercel. Vercel will detect Vite automatically; use `npm run build` as the build command and `dist` as the output directory if prompted.
