# CodeStrike Homebrew Formula

class Codestrike < Formula
  desc "Open-source AI-powered coding assistant for the terminal"
  homepage "https://github.com/harshsharma-x/codestrike"
  url "https://registry.npmjs.org/codestrike/-/codestrike-0.1.0.tgz"
  sha256 ""
  license "MIT"

  livecheck do
    url "https://registry.npmjs.org/codestrike/latest"
    regex(/["']version["']:\s*["']([^"']+)["']/i)
  end

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "codestrike", shell_output("#{bin}/codestrike --version")
    assert_match "doctor", shell_output("#{bin}/codestrike --help")
  end
end
