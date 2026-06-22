# Axiom Red-Team CLI Backend

Terminal-based AI penetration testing framework with 40+ integrated tools.

## Quick Start

```bash
# 1. Setup
bash cli_run.sh

# 2. Launch
python3 axiom_cli.py
```

See [Quick Start Guide](../docs/QUICK_START.md) for full instructions.

## Files

| File | Purpose | Language |
|------|---------|----------|
| **axiom_cli.py** | Main terminal UI and command loop | Python |
| **axiom_exec.py** | Code/command execution engine | Python |
| **axiom_chat.py** | AI integration (Emergent, OpenAI-compatible) | Python |
| **axiom_tools.py** | Tool installation and management | Python |
| **cli_run.sh** | Automated setup script | Bash |
| **install_tools.sh** | Tool installation script | Bash |
| **requirements_cli.txt** | Python package dependencies | TXT |

## Architecture

### axiom_cli.py (450 lines)

Main CLI application with:
- Rich terminal UI (formatted tables, panels, progress)
- Command parser (`/chat`, `/exec`, `/tools`, etc.)
- Chat loop with auto-execution
- Tool status display

### axiom_exec.py (200 lines)

Code execution engine with:
- Async subprocess execution
- Support for 12+ languages (bash, python, node, go, ruby, etc.)
- Timeout protection (configurable)
- Process signal handling
- Per-execution isolation

### axiom_chat.py (180 lines)

AI integration layer:
- Emergent Universal LLM (Claude Sonnet 4.5)
- Custom OpenAI-compatible providers
- Streaming responses
- Code block extraction
- System prompt for red-teaming

### axiom_tools.py (200 lines)

Penetration testing tool management:
- Auto-installation of 40+ tools
- Idempotent installation (safe to run multiple times)
- Tool status verification
- Background installation with locking

## Setup

### Requirements

- Linux/Unix (Ubuntu, Debian, CentOS, macOS, WSL)
- Python 3.8+
- ~2GB disk space
- Sudo access (for tool installation)

### Installation

```bash
bash cli_run.sh
```

This will:
1. Create Python virtual environment
2. Install Python dependencies (rich, httpx, python-dotenv)
3. Generate `.env` configuration template
4. Optionally launch the app

### Configuration

Edit `.env` (created by setup script):

```bash
# Option 1: Emergent (Free tier available)
EMERGENT_LLM_KEY=your_key_here
# Get key at: https://emergentintegrations.com

# Option 2: OpenAI-compatible (OpenAI, Groq, Mistral, etc.)
CUSTOM_LLM_BASE_URL=https://api.openai.com/v1
CUSTOM_LLM_API_KEY=sk-...
CUSTOM_LLM_MODEL=gpt-4

# Optional
DEFAULT_LLM_MODEL=claude-sonnet-4-5-20250929
EXEC_TIMEOUT_SECONDS=120
```

## Usage

### Launch

```bash
python3 axiom_cli.py
```

### Commands

```
/chat <message>     Send to AI (triggers auto-execution of code blocks)
/exec <command>     Execute bash command directly
/tools              List installed tools
/status             Check tool installation status
/auto-exec          Toggle automatic code execution (default: on)
/clear              Clear chat history
/help               Show available commands
/quit               Exit Axiom
```

### Example

```
> /chat Scan scanme.nmap.org for open ports

Axiom: I'll perform a service scan on scanme.nmap.org...
[Auto-executing bash]
[✓ Success] 
Port 22/tcp   ssh     OpenSSH 6.6.1
Port 80/tcp   http    Apache httpd 2.4.7
Port 443/tcp  https   Apache httpd 2.4.7

The target is running Apache 2.4.7. Let me check for known vulnerabilities...
```

## Development

### Project Structure

```
backend/
├── axiom_cli.py           Main app
├── axiom_exec.py          Execution engine
├── axiom_chat.py          AI integration
├── axiom_tools.py         Tool management
├── cli_run.sh             Setup script
├── install_tools.sh       Tool installer
├── requirements_cli.txt   Dependencies
└── .env                   Configuration (created)
```

### Code Style

- Python 3.8+ compatible
- Async/await for I/O operations
- Type hints where practical
- Rich library for terminal UI

### Adding Tools

Edit `axiom_tools.py` in the `TOOLS_TO_INSTALL` dictionary:

```python
TOOLS_TO_INSTALL = {
    "your_tool": {"apt": "package-name", "desc": "Description"},
}
```

### Adding Commands

Edit `axiom_cli.py` in the main command handler:

```python
elif cmd == "/newcommand":
    # Handle your new command
    pass
```

## Troubleshooting

### "No LLM configured"
Make sure `.env` has either:
- `EMERGENT_LLM_KEY=...`, or
- `CUSTOM_LLM_API_KEY=...` with `CUSTOM_LLM_BASE_URL` and `CUSTOM_LLM_MODEL`

### Tools not installing
```bash
bash install_tools.sh
```

### Permission denied
Some tools (nmap, masscan) may need root:
```bash
sudo python3 axiom_cli.py
```

### Command not found
Wait for background tool installation, or install manually:
```bash
sudo apt-get install -y nmap sqlmap nikto whatweb gobuster
```

## Performance

- **Startup**: 2-3 seconds (tool check)
- **First run**: 5+ minutes (tool installation)
- **Chat response**: 5-30 seconds (AI provider dependent)
- **Command execution**: Instant to 120s (configurable)
- **Memory**: ~50MB base + AI provider overhead

## Security

⚠️ **Important**:

- Only test systems you own or have written authorization to test
- Penetration testing without permission is illegal
- Keep `.env` private (never commit to git)
- Tool output may contain sensitive data
- Run with appropriate privileges

## Testing

Run syntax checks:
```bash
python3 -m py_compile axiom_cli.py axiom_exec.py axiom_chat.py axiom_tools.py
```

## Documentation

- [Quick Start](../docs/QUICK_START.md) — 5-minute setup guide
- [Full Reference](../docs/REFERENCE.md) — Complete command reference
- [Architecture](../docs/CONVERSION_SUMMARY.md) — Technical details

## License

See [LICENSE](../LICENSE)

---

**Ready to use?** Start here: `bash cli_run.sh`
