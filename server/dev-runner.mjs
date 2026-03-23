import { spawn } from 'node:child_process'

const run = (label, command, args) => {
  const child = spawn(command, args, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${label} exited with code ${code}`)
    }
  })

  return child
}

const processes = [
  run('api', 'node', ['--env-file=.env', 'server/authenticity-api.mjs']),
  run('web', 'npm', ['run', 'dev']),
]

const shutdown = () => {
  for (const processRef of processes) {
    if (!processRef.killed) {
      processRef.kill('SIGTERM')
    }
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
