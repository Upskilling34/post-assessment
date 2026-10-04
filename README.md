# Juniper Salon opening concierge

A working Temporal prototype for filling last-minute salon openings without manual follow-up. Staff create an opening, and the Workflow offers it to one eligible waitlist client at a time. A client has 15 minutes to accept or decline; a decline or timeout advances to the next person automatically.

## Prototype behavior

- Filters sample waitlist clients by service, stylist preference, and text consent.
- Prioritizes the longest-waiting suitable clients.
- Holds the opening for the first timely acceptance.
- Shows the current offer, next client, deadline, and per-opening history.
- Lets staff stop outreach, mark the opening filled, or select a client manually.
- Uses a direct client offer page with no account required.

All texts and client data are simulated. The prototype does not send SMS or update Square; staff continue to update Square manually.

## Important: create a new public repository—do not fork

Your submission must be in a brand-new **public** GitHub repository. **Do not use GitHub’s Fork button.** Forks connect submissions through GitHub’s fork network and can make other participants’ work easier to locate.

Do not add `john-b-yang` or `vishakhpk` as collaborators. Because the repository is public, the assessment team can review it without write access.

Before the timed assessment:

1. Create a new **public** repository in your assigned GitHub organization. Do not initialize it with a README.
2. Clone the starter:

   ```bash
   git clone <STARTER_REPOSITORY_URL> temporal-assessment
   cd temporal-assessment
   ```

3. Point the clone at your new repository:

   ```bash
   git remote remove origin
   git branch -M main
   git remote add origin git@github.com:<YOUR_ORGANIZATION>/<YOUR_REPOSITORY>.git
   git push -u origin main
   ```

4. Confirm that GitHub displays the **Public** label and does not say “forked from” another repository.

If you accidentally create a fork, do not push assessment work to it. Create a new public repository, change your local `origin`, and ask the course team to remove the fork. Do not search for or view other participants’ assessment repositories.

## Run locally

Requirements: Node.js 20 or newer and Docker Desktop.

```bash
npm install
npm run dev
```

Open <http://localhost:3000> to use the staff prototype. Inspect Workflow executions in the Temporal Web UI at <http://localhost:8233>.

Other commands:

```bash
npm test          # Run the starter Workflow test without Docker
npm run typecheck # Check TypeScript
npm run stop      # Stop the local Temporal service
```

## Repository map

- `src/workflows.ts` - durable opening sequence, timers, Signals, and status Query
- `src/worker.ts` - Worker and Task Queue configuration
- `src/api.ts` - browser-facing API, sample waitlist, and Temporal Client
- `src/types.ts` - shared opening and waitlist types
- `public/` - staff control room and client offer page
- `tests/` - Workflow test for decline, advancement, and acceptance
- `output/pdf/` - standalone presentation for Lena

You may change any application file. Do not edit generated files in `node_modules`.

## Documentation

- [TypeScript developer guide](https://docs.temporal.io/develop/typescript)
- [Workflows](https://docs.temporal.io/workflows)
- [Activities](https://docs.temporal.io/activities)
- [Signals, Queries, and Updates](https://docs.temporal.io/encyclopedia/workflow-message-passing)
