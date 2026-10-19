FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Pre-create the Claude config dir owned by the non-root user so the named
# volume mounted here inherits that ownership (we drop all caps, so no chown later).
RUN mkdir -p /home/vscode/.claude && chown vscode:vscode /home/vscode/.claude
