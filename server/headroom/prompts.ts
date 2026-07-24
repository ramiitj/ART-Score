// Fixed, versioned self-revision prompt: the model critiques and improves its
// own prior output with no human input. This establishes the self-revised
// ceiling that Headroom is anchored against, so the human is only ever
// credited for improvement beyond what the model reaches unaided.
export function buildSelfRevisePrompt(task: string, priorOutput: string): string {
  return `Task:
${task}

Your previous answer:
"${priorOutput}"

Critically revise your own answer to make it as excellent as you can for the
task. Improve substance, not just wording. Output only the revised answer.`;
}
