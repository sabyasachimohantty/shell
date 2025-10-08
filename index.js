import readline from 'node:readline/promises'
import { spawn } from 'child_process'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import fs from 'fs/promises'

const HISTORY_FILE = '.zsh_history'

const currentDirectoryPath = process.cwd()
let currentDirectoryName = path.basename(currentDirectoryPath)

let activeChildProcesses = []
let history = []

async function saveHistory() {
    try {
        await fs.writeFile(HISTORY_FILE, history.reverse().join('\n'), 'utf-8')
    } catch (error) {
        console.error('Error saving history file: ', error)
    }
}

async function loadHistory() {
    try {
        const data = (await fs.readFile(HISTORY_FILE, 'utf-8')).trim()
        history = data.split('\n')
    } catch (error) {
        if (error.code === 'ENOENT') {
            return
        }
        
        throw new Error(`Error loading history file : ${error.message}`)
    }
}

async function runPipeline(commands) {
    if (commands.length === 0) {
        return ''
    }

    let finalOutput = '';
    let previousProcess;
    let lastProcess;

    try {

        previousProcess = await new Promise((resolve, reject) => {
            const child = spawn(commands[0].name, commands[0].args)

            child.on('error', (error) => {
                reject(new Error(`Failed to start command '${commands[0].name}': ${error.message}`));
            })

            resolve(child)
        })
        activeChildProcesses.push(previousProcess)

        previousProcess.stderr.pipe(process.stderr)

        for (let i = 1; i < commands.length; i++) {
            const currentCommand = commands[i]
            const currentProcess = await new Promise((resolve, reject) => {
                const child = spawn(currentCommand.name, currentCommand.args)

                child.on('error', (error) => {
                    reject(new Error(`Failed to start command '${commands[0].name}': ${error.message}`));
                })

                resolve(child)
            })

            activeChildProcesses.push(currentProcess)

            currentProcess.stderr.pipe(process.stderr)

            await pipeline(previousProcess.stdout, currentProcess.stdin)

            previousProcess = currentProcess
        }

        lastProcess = previousProcess

        for await (const chunk of lastProcess.stdout) {
            finalOutput += chunk.toString()
        }

        await new Promise((resolve, reject) => {
            lastProcess.on('close', (code) => {
                if (code != 0) {
                    reject(new Error(`Command exited with non-zero code: ${code}`))
                } else {
                    resolve(code)
                }
            })
        })

        return finalOutput.trim()

    } catch (error) {
        throw error
    } finally {
        activeChildProcesses = []
    }
}


async function main() {
    await loadHistory()

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `-(${currentDirectoryName})- zsh> `,
        history: history.reverse(),
        historySize: 100,
    })

    process.on('SIGINT', () => {
        console.log('^C')
        activeChildProcesses.forEach((child) => {
            if (!child.killed) {
                child.kill('SIGINT')
            }
        })

        activeChildProcesses = []
        rl.prompt()
    })

    rl.on('SIGINT', () => {
        console.log('^C')
        rl.prompt();
    });

    // main loop
    rl.prompt()
    rl.on('line', async (line) => {
        const input = line.trim()

        if (input === '') {
            rl.prompt()
            return
        }

        if (input === 'exit') {
            rl.close()
            return
        }

        if (input === 'history') {
            history.toReversed().forEach((val, ind) => {
                console.log(`${ind + 1}. ${val}`)
            })
            rl.prompt()
            return
        }

        let commands = []
        input.trim().split('|').forEach((val) => {
            const [name, ...args] = val.trim().split(' ')
            commands.push({ name, args })
        })


        try {
            if (commands[0].name === 'cd') {
                process.chdir(commands[0].args[0])
                currentDirectoryName = path.basename(process.cwd())
                rl.setPrompt(`-(${currentDirectoryName})- zsh> `)
            } else {
                const result = await runPipeline(commands)
                console.log(result)
            }
        } catch (error) {
            console.log(error)
        }

        rl.prompt()
    })

    rl.on('close', async () => {
        await saveHistory()
        process.exit(0)
    })

}


// Main function to run the shell
main()