import { BaseAgent } from '../base';
import { AIRouter } from '@codestrike/ai';

export class TestingAgent extends BaseAgent {
  constructor(router: AIRouter) {
    super('testing', 'Testing', router);
  }

  get systemPrompt(): string {
    return `You are the Testing Agent. Your role is to write comprehensive tests for code.
Generate tests that cover:
1. Unit tests for individual functions and classes
2. Integration tests for component interactions
3. Edge cases and boundary conditions
4. Error handling paths
5. Performance considerations

For each test:
- Use the appropriate testing framework (Jest, Vitest, pytest, etc.)
- Write descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Include both positive and negative test cases
- Test error conditions
- Keep tests independent and idempotent

Output the complete test file with all necessary imports and setup.`;
  }

  get temperature(): number {
    return 0.3;
  }

  get maxTokens(): number {
    return 4096;
  }
}
