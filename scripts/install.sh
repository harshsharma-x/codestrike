#!/usr/bin/env bash
set -euo pipefail

REPO="harshsharma-x/codestrike"
INSTALL_DIR="${CODESTRIKE_DIR:-$HOME/.codestrike}"
BIN_DIR="$INSTALL_DIR/bin"
VERSION="${1:-latest}"

print_bold()  { printf "\033[1m%s\033[0m\n" "$1"; }
print_cyan()  { printf "\033[36m%s\033[0m\n" "$1"; }
print_green() { printf "\033[32m%s\033[0m\n" "$1"; }
print_red()   { printf "\033[31m%s\033[0m\n" "$1"; }

echo ""
print_cyan "  ⚡ CodeStrike AI Installer"
echo ""

# Check for Node.js
if ! command -v node &>/dev/null; then
  print_red "  Node.js is required but not installed."
  echo "  Install it from https://nodejs.org or use your package manager."
  echo "  Example: brew install node@20  (macOS)"
  echo "  Example: apt install nodejs    (Linux)"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  print_red "  Node.js 18+ required (found v$(node -v))"
  exit 1
fi

# Check for npm
if ! command -v npm &>/dev/null; then
  print_red "  npm is required but not installed."
  exit 1
fi

print_bold "  Installing codestrike via npm..."
echo ""

if [ "$VERSION" = "latest" ]; then
  npm install -g codestrike
else
  npm install -g "codestrike@$VERSION"
fi

echo ""
print_green "  ✓ CodeStrike installed successfully!"
echo ""

# Check for API keys
print_bold "  Quick start:"
echo "    codestrike --help          # View all commands"
echo "    codestrike doctor          # Check system health"
echo "    codestrike providers       # List AI providers"
echo "    codestrike init            # Initialize in a project"
echo "    codestrike chat            # Start interactive chat"
echo ""

# Check for git
if command -v git &>/dev/null; then
  print_green "  ✓ Git found"
else
  print_red "  ✗ Git not found (needed for git integration)"
fi

# Check for Ollama
if command -v ollama &>/dev/null; then
  print_green "  ✓ Ollama found (local AI ready)"
else
  echo "  ℹ  Ollama not found (optional - for local AI)"
  echo "     Install: curl -fsSL https://ollama.ai/install.sh | sh"
fi

echo ""
print_cyan "  Need help? https://github.com/$REPO"
echo ""
