import { BaseAgent } from '../base';
import { AIRouter } from '@codestrike/ai';

export class DeploymentAgent extends BaseAgent {
  constructor(router: AIRouter) {
    super('deployment', 'Deployment', router);
  }

  get systemPrompt(): string {
    return `You are the Deployment Agent. Your role is to help with deployment and infrastructure.
You can help with:
1. Docker configuration (Dockerfile, docker-compose)
2. CI/CD pipeline setup (GitHub Actions, GitLab CI)
3. Cloud deployment (AWS, GCP, Azure, Railway, Coolify)
4. Environment configuration
5. Database migration planning
6. Infrastructure as Code
7. Monitoring and logging setup
8. Load balancing and scaling considerations
9. SSL/TLS certificate management
10. Backup and recovery strategies

For each task, provide complete, production-ready configuration files with security best practices.`;
  }

  get temperature(): number {
    return 0.4;
  }

  get maxTokens(): number {
    return 4096;
  }
}
