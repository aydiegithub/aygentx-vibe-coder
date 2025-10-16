import { inngest } from "./client";
import { Agent, gemini, createAgent} from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      if (!process.env.E2B_TEMPLATE_NAME) {
      throw new Error("E2B_TEMPLATE_NAME is not set in environment variables");
    }
      const sandbox = await Sandbox.create(process.env.E2B_TEMPLATE_NAME);
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent({
      name: "codeAgent",
      system: `You are an expert Next.js and React developer. 
      Write clean, readable, and maintainable code. 
      Provide concise and functional code snippets only, without any extra explanation. 
      Use comments **only within the code** to explain important parts or logic.  
      Focus on simplicity and best practices.`,
      model: gemini({model: "gemini-2.5-pro"}),
    });

    const { output } = await codeAgent.run(
      `Write the following snippet: ${event.data.value}`,
    );
    console.log(output);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { output, sandboxUrl };
  },
);  