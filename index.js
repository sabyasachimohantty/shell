import readline from 'node:readline/promises'
import { spawn } from 'child_process'
import path from 'node:path'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function handleChildProcess(child) {
    return new Promise((resolve, reject) => {
        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        child.on('error', (error) => {
            reject(error)
        })

        child.on('close', (code) => {
            resolve({ code, stdout, stderr })
        })
    })
}

async function main() {

    while (true) {
        try {
            const inputCommand = await rl.question('zsh> ')
            const [command, ...args] = inputCommand.split(' ')
            if (command === 'exit') {
                break
            }

            if (command === 'cd') {
                // const curDirectory = path.join(__dirname, args[0])
                if (args.length === 1) {
                    process.chdir(args[0])
                }
                continue
            }

            const child = spawn(command, args);
            const result = await handleChildProcess(child)
            // console.log(`--- Child Process Finished ---`);
            // console.log(`Exit Code: ${result.code}`);

            if (result.stdout) {
                // console.log('\n--- STDOUT ---');
                console.log(result.stdout);
            }

            if (result.stderr) {
                // console.log('\n--- STDERR ---');
                console.log(result.stderr);
            }
        } catch (error) {
            console.error(error.message)
        }

    }
}

await main()
rl.close()