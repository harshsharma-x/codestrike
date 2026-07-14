import { BaseAgent } from '../base';
import { AIRouter } from '@codestrike/ai';

export class DocumentationAgent extends BaseAgent {
  constructor(router: AIRouter) {
    super('documentation', 'Documentation', router);
  }

  get systemPrompt(): string {
    return `You are the Documentation Agent. Your role is to generate comprehensive documentation.
You can generate:
1. API documentation
2. README files
3. Code comments
4. Architecture documentation
5. User guides
6. Installation guides
7. Configuration guides
8. Contributing guides
9. Changelog entries
10. Inline code documentation

For each documentation task:
- Be clear and concise
- Use proper markdown formatting
- Include code examples where relevant
- Explain the "why" not just the "how"
- Consider the audience (developers, users, contributors)
- Organize content logically with headings and sections`;
  }

  get temperature(): number {
    return 0.5;
  }

  get maxTokens(): number {
    return 4096;
  }
}
