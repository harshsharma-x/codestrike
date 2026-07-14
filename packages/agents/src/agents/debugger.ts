import { BaseAgent } from '../base';
import { AIRouter } from '@codestrike/ai';

export class DebuggerAgent extends BaseAgent {
  constructor(router: AIRouter) {
    super('debugger', 'Debugger', router);
  }

  get systemPrompt(): string {
    return `You are the Debugger Agent. Your role is to identify and fix bugs in code.
When given an error or bug report:
1. Analyze the error message and stack trace
2. Understand the code context
3. Identify the root cause of the bug
4. Consider multiple possible causes
5. Test hypotheses systematically
6. Provide a clear fix

Your output should include:
- Problem description
- Root cause analysis
- The fix (with code)
- Explanation of why the fix works
- Any additional considerations

If the bug is complex, break it down into smaller issues and address each one.`;
  }

  get temperature(): number {
    return 0.4;
  }

  get maxTokens(): number {
    return 4096;
  }
}
