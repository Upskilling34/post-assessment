import { condition, defineQuery, defineSignal, setHandler, sleep } from "@temporalio/workflow";
import type { Decision, OpeningInput, OpeningStatus, StaffAction } from "./types";
export const respondToOffer = defineSignal<[string, Decision]>("respondToOffer");
export const staffControl = defineSignal<[StaffAction, string?]>("staffControl");
export const getOpeningStatus = defineQuery<OpeningStatus>("getOpeningStatus");
const stamp = () => new Date().toISOString();

export async function appointmentOpeningWorkflow(input: OpeningInput): Promise<OpeningStatus> {
  const candidates = input.candidates.filter((c) => c.smsOptIn).sort((a, b) => a.waitlistedAt.localeCompare(b.waitlistedAt));
  let index = 0; let response: { clientId: string; decision: Decision } | undefined; let control: { action: StaffAction; clientId?: string } | undefined;
  let status: OpeningStatus = { opening: input, phase: "ready", contactedIds: [], history: [{ at: stamp(), kind: "opened", text: "Opening created. Outreach is simulated; Square is unchanged." }] };
  const add = (kind: OpeningStatus["history"][number]["kind"], text: string) => { status = { ...status, history: [...status.history, { at: stamp(), kind, text }] }; };
  setHandler(getOpeningStatus, () => status);
  setHandler(respondToOffer, (clientId, decision) => { response = { clientId, decision }; });
  setHandler(staffControl, (action, clientId) => { control = { action, clientId }; });
  while (index < candidates.length) {
    if (control?.action === "close" || control?.action === "filled-manually") break;
    if (control?.action === "choose-client" && control.clientId) { const selected = candidates.findIndex((c) => c.id === control!.clientId); if (selected >= 0 && !status.contactedIds.includes(control.clientId)) index = selected; control = undefined; }
    const client = candidates[index]; const now = Date.now(); const cutoff = new Date(input.latestArrivalAt).getTime();
    if (now >= cutoff) { status = { ...status, phase: "exhausted", reason: "Latest acceptable arrival time passed" }; break; }
    const deadlineMs = Math.min(now + input.responseMinutes * 60_000, cutoff); const deadline = new Date(deadlineMs).toISOString(); response = undefined;
    status = { ...status, phase: "offering", currentClient: client, offerDeadline: deadline, nextClient: candidates[index + 1], contactedIds: [...status.contactedIds, client.id] };
    add("offer-sent", `Simulated text sent to ${client.name}; waiting until ${new Date(deadline).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`);
    const received = await condition(() => Boolean(response) || Boolean(control), deadlineMs - now);
    if (control?.action === "close" || control?.action === "filled-manually") break;
    if (control?.action === "choose-client") {
      const chosen = candidates.find((candidate) => candidate.id === control?.clientId);
      if (chosen) add("offer-sent", `Staff selected ${chosen.name}; sending their offer next.`);
      continue;
    }
    const answer = response as { clientId: string; decision: Decision } | undefined;
    if (received && answer?.clientId === client.id && answer.decision === "accepted") { status = { ...status, phase: "held", heldFor: client, currentClient: undefined, nextClient: undefined }; add("accepted", `${client.name} accepted. Appointment is held; staff must update Square manually.`); return status; }
    if (received && answer?.clientId === client.id && answer.decision === "declined") add("declined", `${client.name} declined the offer.`); else add("timed-out", `${client.name} did not respond before the deadline.`);
    index += 1; await sleep(1);
  }
  if (control?.action === "filled-manually") { status = { ...status, phase: "filled-manually", currentClient: undefined, nextClient: undefined, reason: "Staff filled the opening outside this prototype" }; add("filled-manually", "Staff marked the opening filled manually. Outreach stopped."); }
  else if (control?.action === "close") { status = { ...status, phase: "closed", currentClient: undefined, nextClient: undefined, reason: "Closed by staff" }; add("closed", "Staff closed the opening. Outreach stopped."); }
  else status = { ...status, phase: "exhausted", currentClient: undefined, nextClient: undefined, reason: status.reason ?? "No eligible clients remain" };
  return status;
}
