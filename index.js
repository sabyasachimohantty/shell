import readline from 'node:readline/promises'
import { spawn } from 'child_process'
import { pipeline } from 'node:stream/promises'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// function handleChildProcess(child) {
//     return new Promise((resolve, reject) => {
//         let stdout = ''
//         let stderr = ''

//         child.stdout.on('data', (data) => {
//             stdout += data.toString()
//         })

//         child.stderr.on('data', (data) => {
//             stderr += data.toString()
//         })

//         child.on('error', (error) => {
//             reject(error)
//         })

//         child.on('close', (code) => {
//             resolve({ code, stdout, stderr })
//         })
//     })
// }

async function runPipeline(commands) {
    if (commands.length === 0) {
        return ''
    }

    let finalOutput = '';
    let previousProcess;
    let lastProcess;

    try {
        
        previousProcess = spawn(commands[0].name, commands[0].args)

        previousProcess.stderr.pipe(process.stderr)

        for (let i = 1; i < commands.length; i++) {
            const currentCommand = commands[i]
            const currentProcess = spawn(currentCommand.name, currentCommand.args)
            
            currentProcess.stderr.pipe(process.stderr)

            await pipeline(previousProcess.stdout, currentProcess.stdin)

            previousProcess = currentProcess
        }

        lastProcess = previousProcess

        for await (const chunk of lastProcess.stdout) {
            finalOutput += chunk.toString()
        }

        const exitCode = await new Promise((resolve, reject) => {
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
    }
}

async function main() {

    while (true) {
        try {
            const input = await rl.question('zsh> ')
            let commands = []
            input.trim().split('|').forEach((val) => {
                const [name, ...args] = val.trim().split(' ')
                commands.push({name, args})
            })

            if (commands[0].name === 'exit') {
                break
            }

            if (commands[0].name === 'cd') {
                process.chdir(commands[0].args[0])
                continue
            }
            
            const result = await runPipeline(commands)
            console.log(result)

            // const [command, ...args] = inputCommand.split(' ')
            // if (command === 'exit') {
            //     break
            // }

            // if (command === 'cd') {
            //     if (args.length === 1) {
            //         process.chdir(args[0])
            //     }
            //     continue
            // }

            // const child = spawn(command, args);
            // const result = await handleChildProcess(child)

            // if (result.stdout) {
            //     console.log(result.stdout);
            // }

            // if (result.stderr) {
            //     console.log(result.stderr);
            // }
        } catch (error) {
            console.error(error.message)
        }

    }
}

await main()
rl.close()