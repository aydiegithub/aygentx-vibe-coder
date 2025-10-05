import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // Task 1
    await step.sleep("wait-a-moment", "10s");

    // Task 2
    await step.sleep("wait-a-moment", "5s");

    // Task 3
    await step.sleep("wait-a-moment", "15s");
    return { message: `Hello ${event.data.email}!` };
  },
);