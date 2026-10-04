import { randomUUID } from "node:crypto";
import path from "node:path";
import { Client, Connection } from "@temporalio/client";
import express, { type NextFunction, type Request, type Response } from "express";
import type { OpeningInput, OpeningStatus, WaitlistClient } from "./types";
import { appointmentOpeningWorkflow } from "./workflows";
const app = express(); app.use(express.json()); app.use(express.static(path.join(process.cwd(), "public")));
const clients: WaitlistClient[] = [
  { id: "maya", name: "Maya Chen", phone: "••• ••• 0184", service: "Haircut", stylist: "Avery", availability: "Today after 1 PM", waitlistedAt: "2026-09-04", smsOptIn: true },
  { id: "jordan", name: "Jordan Lee", phone: "••• ••• 4421", service: "Haircut", stylist: "Any stylist", availability: "Today 2–5 PM", waitlistedAt: "2026-09-10", smsOptIn: true },
  { id: "priya", name: "Priya Shah", phone: "••• ••• 9230", service: "Haircut", stylist: "Avery", availability: "Today after 3 PM", waitlistedAt: "2026-09-18", smsOptIn: true },
  { id: "noah", name: "Noah Williams", phone: "••• ••• 7705", service: "Haircut", stylist: "Any stylist", availability: "Weekday afternoons", waitlistedAt: "2026-09-21", smsOptIn: false },
];
let clientPromise: Promise<Client> | undefined;
const temporal = () => clientPromise ??= Connection.connect({ address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233" }).then((connection) => new Client({ connection }));
const statusFor = async (id: string) => (await temporal()).workflow.getHandle(id).query<OpeningStatus>("getOpeningStatus");
app.get("/api/clients", (_req, res) => res.json(clients));
app.post("/api/openings", async (req, res) => { const id = `opening-${randomUUID()}`; const body = req.body as Partial<OpeningInput>; const service = body.service ?? "Haircut"; const stylist = body.stylist ?? "Avery"; const input: OpeningInput = { id, service, stylist, startsAt: body.startsAt ?? new Date(Date.now() + 90 * 60_000).toISOString(), latestArrivalAt: body.latestArrivalAt ?? new Date(Date.now() + 60 * 60_000).toISOString(), responseMinutes: 15, candidates: clients.filter((c) => c.service === service && (c.stylist === "Any stylist" || c.stylist === stylist)) }; await (await temporal()).workflow.start(appointmentOpeningWorkflow, { workflowId: id, taskQueue: "juniper-openings", args: [input] }); res.status(201).json({ id }); });
app.get("/api/openings/:id", async (req, res) => res.json(await statusFor(req.params.id)));
app.post("/api/openings/:id/respond", async (req, res) => { const status = await statusFor(req.params.id); if (status.phase !== "offering" || status.currentClient?.id !== req.body.clientId) return res.json({ result: "unavailable" }); await (await temporal()).workflow.getHandle(req.params.id).signal("respondToOffer", req.body.clientId, req.body.decision); res.json({ result: req.body.decision }); });
app.post("/api/openings/:id/control", async (req, res) => { await (await temporal()).workflow.getHandle(req.params.id).signal("staffControl", req.body.action, req.body.clientId); res.status(202).json({ accepted: true }); });
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { console.error(error); res.status(500).json({ error: error instanceof Error ? error.message : "Unexpected error" }); });
app.listen(Number(process.env.PORT ?? 3000), () => console.log("Juniper prototype at http://localhost:3000"));
