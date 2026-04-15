import net from 'node:net'

type SendMailInput = {
  host: string
  port: number
  from: string
  to: string
  subject: string
  text: string
}

function normalizeLines(text: string) {
  return text.replace(/\r?\n/g, '\r\n')
}

function dotStuff(text: string) {
  return text
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n')
}

async function readResponse(socket: net.Socket): Promise<string> {
  return await new Promise((resolve, reject) => {
    const onData = (buf: Buffer) => {
      const s = buf.toString('utf8')
      // Basic: accept when we see a line ending.
      if (s.includes('\n')) {
        cleanup()
        resolve(s)
      }
    }

    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }

    const onClose = () => {
      cleanup()
      reject(new Error('SMTP connection closed'))
    }

    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
      socket.off('close', onClose)
    }

    socket.on('data', onData)
    socket.on('error', onError)
    socket.on('close', onClose)
  })
}

async function sendCommand(socket: net.Socket, command: string) {
  socket.write(`${command}\r\n`)
  const resp = await readResponse(socket)
  return resp
}

function assertOk(response: string) {
  const code = Number.parseInt(response.slice(0, 3), 10)
  if (!Number.isFinite(code) || code >= 400) {
    throw new Error(`SMTP error: ${response.trim()}`)
  }
}

export async function sendMail(input: SendMailInput) {
  const socket = net.createConnection({ host: input.host, port: input.port })

  try {
    const banner = await readResponse(socket)
    assertOk(banner)

    let resp = await sendCommand(socket, 'EHLO lowtrello')
    assertOk(resp)

    resp = await sendCommand(socket, `MAIL FROM:<${input.from}>`)
    assertOk(resp)

    resp = await sendCommand(socket, `RCPT TO:<${input.to}>`)
    assertOk(resp)

    resp = await sendCommand(socket, 'DATA')
    assertOk(resp)

    const headers = [
      `From: ${input.from}`,
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit'
    ].join('\r\n')

    const body = dotStuff(normalizeLines(input.text))
    socket.write(`${headers}\r\n\r\n${body}\r\n.\r\n`)

    resp = await readResponse(socket)
    assertOk(resp)

    await sendCommand(socket, 'QUIT')
  } finally {
    socket.end()
  }
}
