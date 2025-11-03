import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";
import { SANDBOX_TIME_OUT } from "./types";

export async function getSandbox(sandboxId: string) {
    const sandbox = await Sandbox.connect(sandboxId);
    sandbox.setTimeout(SANDBOX_TIME_OUT)
    return sandbox;
};

export function lastAssistantTextMessageContent(result: AgentResult) {
    const lastAssistantTextMessageIndex = result.output.findLastIndex(
        (message) => message.role === "assistant",
    );
    const message = result.output[lastAssistantTextMessageIndex] as
        | TextMessage
        | undefined;

    return message?.content
        ? typeof message.content === "string"
            ? message.content
            : message.content.map((c) => c.text).join("")
        : undefined;
}