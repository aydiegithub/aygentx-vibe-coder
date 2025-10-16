import { inngest } from "./client";
import { gemini, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { PROMPT } from "@/prompts";
import { title } from "process";

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
      description: "An expert coding agent.",
      system: PROMPT,
      model: gemini({
        model: "gemini-2.5-pro",
      }),
      
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands.",
          parameters: z.object({
            command: z.string(),
          }) as any,
          handler: async  ({ command }, {step}) => {
            return await step?.run("terminal", async () => {
              const buffers = {stdout: "", stderr: ""};
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  }
                });
                return result.stdout;
              } 
              catch (e) {
                return `Command failed: ${e} 
                       \nstdout: ${buffers.stdout} 
                       \nstderror: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in Sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }) as any,
          handler: async (input: any, opts: any) => {
            const { files } = input;
            const { step, network } = opts;
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (e) {
                return "Error: " + e;
              }
            });

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          }
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox.",
          parameters: z.object({
            files: z.array(z.string()),
          }) as any,
          handler: async (input: any, opts: any) => {
            const { files } = input;
            const { step } = opts;
            return await step?.run("readFiles", async () => {
              try{
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content})
                }
                return JSON.stringify(contents);
              }
              catch (e) {
                return "Error: " + e;
              }
            })
          }
        })
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessage = 
            lastAssistantTextMessageContent(result);

          if (lastAssistantTextMessage && network) {
            if (lastAssistantTextMessage.includes("<task_summary>")){
              network.state.data.summary = lastAssistantTextMessage;
            }
          }

          return result;
        },
      }
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }
        return codeAgent;
      }
    })

    const result = await network.run(event.data.value);

    // const { output } = await codeAgent.run(
    //   `Write the following snippet: ${event.data.value}`,
    // );
    // console.log(output);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { 
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
