# Local Setup (Codex Windows)

Repository path:

`C:\Users\BETTERMONDAY\Documents\Codex\2026-04-27\github-plugin-github-openai-curated-https\franchise-field-os`

## Recommended flow

Use system Python 3.12+ and create a local `.venv`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-system-python.ps1
```

After that, the run scripts automatically prefer `.venv`.

## Fallback flow

If system Python is not installed, keep using the bundled Codex runtime:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-bundled-python.ps1
```

This installs dependencies into `.pydeps` and keeps everything local to the repository.

## Run commands

Static MVP:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\open-mvp.ps1
```

API app:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-api.ps1
```

Automation app:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-automation.ps1
```

## VS Code

Open the repository in VS Code and use:

- `Terminal > Run Task > Setup: System Python`
- `Terminal > Run Task > Run: API`
- `Terminal > Run Task > Run: Automation`
- `Run and Debug > API: FastAPI (Uvicorn)`

The workspace is configured to prefer `.venv\Scripts\python.exe` when it exists.
