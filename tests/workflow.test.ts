import assert from "node:assert/strict";
import { test } from "node:test";
import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { appointmentOpeningWorkflow, respondToOffer } from "../src/workflows";

test("a decline advances sequential outreach and acceptance holds the opening", async () => {
  const environment = await TestWorkflowEnvironment.createTimeSkipping();
  try {
    const worker = await Worker.create({
      connection: environment.nativeConnection,
      taskQueue: "juniper-test",
      workflowsPath: require.resolve("../src/workflows"),
    });
    await worker.runUntil(async () => {
      const handle = await environment.client.workflow.start(appointmentOpeningWorkflow, {
        workflowId: "juniper-test",
        taskQueue: "juniper-test",
        args: [{ id: "opening-test", service: "Haircut", stylist: "Avery", startsAt: "2026-10-03T17:00:00.000Z", latestArrivalAt: "2030-10-03T17:00:00.000Z", responseMinutes: 15, candidates: [
          { id: "one", name: "One", phone: "1", service: "Haircut", stylist: "Avery", availability: "today", waitlistedAt: "2026-01-01", smsOptIn: true },
          { id: "two", name: "Two", phone: "2", service: "Haircut", stylist: "Avery", availability: "today", waitlistedAt: "2026-01-02", smsOptIn: true },
        ] }],
      });
      await handle.signal(respondToOffer, "one", "declined");
      await new Promise((resolve) => setTimeout(resolve, 100));
      await handle.signal(respondToOffer, "two", "accepted");
      const result = await handle.result();
      assert.equal(result.phase, "held");
      assert.equal(result.heldFor?.id, "two");
    });
  } finally {
    await environment.teardown();
  }
});
