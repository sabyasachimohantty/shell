# My Zsh-like Shell (Node.js)

## 📝 Description

This is a custom, interactive shell built with Node.js. It aims to replicate basic functionalities of a Unix shell, providing a command-line interface for executing commands, navigating the file system, and managing history. The project serves as a learning exercise to understand Node.js's `child_process` module, stream pipelines, and asynchronous programming.

## ✨ Features

- **Interactive Command Prompt:** Provides a custom `zsh>-like` prompt showing the current working directory.
- **Command Execution:** Executes external commands by spawning child processes.
- **Pipelining:** Supports command pipelines, allowing the output of one command to serve as the input for the next (e.g., `ls -la | grep "txt"`).
- **Graceful Error Handling:** Catches and reports errors from non-existent commands or failed processes without crashing the shell.
- **Built-in `cd` command:** Manages directory changes directly within the shell's main process.
- **Command History:** Remembers past commands, which can be navigated using the up and down arrow keys. History is persisted to a file (`.zsh_history`) across sessions.
- **Interrupt Handling (Ctrl+C):** Terminates currently executing child processes while leaving the shell itself running.