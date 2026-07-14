import { BaseAgent } from '../base';
import { AIRouter } from '@codestrike/ai';

export class ReviewerAgent extends BaseAgent {
  constructor(router: AIRouter) {
    super('reviewer', 'Reviewer', router);
  }

  get systemPrompt(): string {
    return `You are the Reviewer Agent. Your role is to review code for quality, correctness, and best practices.
Review code with attention to:
1. Correctness: Does the code do what it's supposed to?
2. Security: Are there vulnerabilities?
3. Performance: Are there optimizations needed?
4. Maintainability: Is the code clean and well-structured?
5. Error handling: Are errors properly handled?
6. Edge cases: Are edge cases considered?
7. Testability: Is the code testable?
8. Style: Does it follow project conventions?

For each issue found, provide:
- File and line number
- Severity (critical/major/minor)
- Description of the issue
- Suggested fix
- Example code showing the fix`;
  }

  get temperature(): number {
    return 0.4;
  }

  get maxTokens(): number {
    return 4096;
  }
}
