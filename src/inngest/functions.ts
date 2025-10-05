import { inngest } from "./client";
import { Agent, gemini, createAgent} from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
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

    return { output };
  },
);  