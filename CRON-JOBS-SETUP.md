# Cron Jobs Setup Guide

## Overview

Two cron jobs have been created to automate:
1. **Late Fee Application** - Applies late fees to overdue invoices daily
2. **Recurring Invoice Generation** - Generates invoices from recurring templates daily

## Vercel Cron Jobs Configuration

The cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/late-fees",
      "schedule": "0 2 * * *"  // Daily at 2 AM UTC
    },
    {
      "path": "/api/cron/recurring-invoices",
      "schedule": "0 1 * * *"  // Daily at 1 AM UTC
    }
  ]
}
```

## Environment Variables

Set the following environment variable in Vercel:

- `CRON_SECRET` or `VERCEL_CRON_SECRET` - Secret key to protect cron endpoints (optional but recommended)

## How It Works

### Late Fee Automation (`/api/cron/late-fees`)

1. Runs daily at 2 AM UTC
2. Finds all overdue invoices (due date passed, status = 'overdue', no late fee applied yet)
3. For each user, gets their default late fee policy
4. Calculates late fee based on:
   - **Flat fee**: Fixed amount
   - **Percentage**: Percentage of invoice total
5. Applies grace period (if configured)
6. Applies max cap (if configured)
7. Updates invoice with late fee amount and timestamp

### Recurring Invoice Generation (`/api/cron/recurring-invoices`)

1. Runs daily at 1 AM UTC
2. Finds all active recurring invoices where `nextGenerationDate` is today or earlier
3. For each recurring invoice:
   - Generates a new invoice from the template
   - Calculates next generation date based on frequency
   - Updates recurring invoice record
4. Skips if invoice already exists for that period

## Testing Locally

You can test the cron jobs locally:

```bash
# Test late fee automation
curl "http://localhost:3000/api/cron/late-fees?secret=YOUR_SECRET"

# Test recurring invoice generation
curl "http://localhost:3000/api/cron/recurring-invoices?secret=YOUR_SECRET"
```

Or without secret (if not set):
```bash
curl "http://localhost:3000/api/cron/late-fees"
curl "http://localhost:3000/api/cron/recurring-invoices"
```

## Manual Trigger (Vercel Dashboard)

You can also manually trigger cron jobs from the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Cron Jobs"
3. Click "Run Now" on any cron job

## Monitoring

Both cron jobs return JSON responses with:
- `success`: Boolean indicating if the job completed
- `timestamp`: When the job ran
- `processed`: Number of items processed
- `feesApplied` / `generated`: Number of actions taken
- `errors`: Array of any errors encountered

Example response:
```json
{
  "success": true,
  "timestamp": "2024-01-15T02:00:00.000Z",
  "processed": 10,
  "feesApplied": 5,
  "errors": []
}
```

## Troubleshooting

### Cron jobs not running

1. **Check Vercel deployment**: Cron jobs only run on production deployments
2. **Verify vercel.json**: Ensure cron configuration is correct
3. **Check logs**: View Vercel function logs for errors
4. **Verify environment variables**: Ensure `CRON_SECRET` is set if using authentication

### Late fees not applying

1. **Check late fee policies**: Ensure users have default policies configured
2. **Verify invoice status**: Invoices must be marked as 'overdue'
3. **Check grace period**: Late fees won't apply during grace period
4. **Review logs**: Check for errors in the cron job execution

### Recurring invoices not generating

1. **Check recurring invoice status**: Must be active (`isActive = 1`)
2. **Verify nextGenerationDate**: Must be today or earlier
3. **Check end date**: Won't generate if end date has passed
4. **Review logs**: Check for errors in invoice generation

## Schedule Customization

To change the schedule, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/late-fees",
      "schedule": "0 2 * * *"  // Cron expression (UTC)
    }
  ]
}
```

Common cron schedules:
- `0 2 * * *` - Daily at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight UTC
- `0 0 1 * *` - First day of every month at midnight UTC

## Security

- Cron jobs are protected by Vercel's built-in authentication
- Optional `CRON_SECRET` provides additional security layer
- Jobs only run on production deployments
- All operations are logged for audit purposes

