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
4. Start with the built-in **Pharmacists Schedule** sample, or set up your own employee roster and recurring shift times.
5. Click **Save as template** in the saved templates bar to keep your own setup in this browser.
6. For a new month, select a saved template to instantly restore the employees and recurring shift times. The app asks for confirmation before replacing the current month setup. The built-in sample cannot be updated or deleted and can be used in any month.
7. Click any calendar date, choose **Add slot**, and select the employee and time for a one-off change.
8. For schedules that repeat, use **Quick setup for the team** to set employee times once for selected weekdays.
9. Use the weekly pattern tabs for special weekday rules, such as Friday coverage or days off.
10. Use **Print / Save PDF** to print the schedule or save it as a PDF from the browser dialog.

The active workspace and saved templates are stored in the current browser with `localStorage`. There is no server, sign-in, database, or schedule history.

## Deploy to Vercel

Import this project into Vercel. Vercel will detect Vite automatically; use `npm run build` as the build command and `dist` as the output directory if prompted.
