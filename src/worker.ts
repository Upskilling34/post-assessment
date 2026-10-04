import { NativeConnection, Worker } from "@temporalio/worker";

async function run(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  });
  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: "juniper-openings",
    workflowsPath: require.resolve("./workflows"),
  });
  console.log("Worker is polling the juniper-openings task queue.");
  await worker.run();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
