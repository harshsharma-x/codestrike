# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in CodeStrike, please do NOT file a public issue.

**Instead, report privately via email:** security@codestrike.ai

Please include:
- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Security Best Practices

- Never share your API keys
- Use `.env` files or `codestrike login` to store keys (never in code)
- Review command execution prompts carefully
- Keep local models (Ollama) updated
