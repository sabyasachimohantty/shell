import readline from 'node:readline/promises'
import { spawn } from 'child_process'

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

            const child = spawn(command, args);
            const result = await handleChildProcess(child)
            console.log(`--- Child Process Finished ---`);
            console.log(`Exit Code: ${result.code}`);

            if (result.stdout) {
                console.log('\n--- STDOUT ---');
                console.log(result.stdout);
            }

            if (result.stderr) {
                console.log('\n--- STDERR ---');
                console.log(result.stderr);
            }
        } catch (error) {
            console.error(error)
        }

    }
}

await main()
rl.close()