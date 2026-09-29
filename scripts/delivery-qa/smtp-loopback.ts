import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {createServer as createTcpServer, type Socket} from 'node:net';
import path from 'node:path';
import {createSecureContext, createServer as createTlsServer, TLSSocket} from 'node:tls';
import {fileURLToPath} from 'node:url';
import {createContentAdminServer} from '../../services/content-admin/server';
import {setupContentAdmin} from '../../services/content-admin/setup';
import {createSmtpSender} from '../../services/content-admin/smtp';
import type {StoredInquiry} from '../../src/lib/inquiry-admin-contracts';

// This verifier never contacts a mail provider. Both supported SMTP ports bind only to loopback.
// It fails if a port is occupied, never stops another process, and retains isolated private QA data.
const origin = 'http://127.0.0.1';
const recipient = 'recipient@example.test';
const senderAddress = 'sender@example.test';

async function childClient() {
  const port = Number(process.env.QA_SMTP_PORT);
  assert.ok(port === 465 || port === 587);
  const mailSender = createSmtpSender({SMTP_HOST: '127.0.0.1', SMTP_PORT: String(port), SMTP_USER: 'local-qa', SMTP_PASSWORD: process.env.QA_SMTP_PASSWORD, SMTP_FROM: senderAddress});
  assert.ok(mailSender);
  if (process.argv.includes('--untrusted')) {
    await assert.rejects(mailSender({to: recipient, subject: 'TLS negative control', body: 'Loopback only', messageId: '<negative@example.test>'}), /certificate|self.signed/i);
    process.stdout.write(JSON.stringify({untrustedCertificateRejected: true}));
    return;
  }
  const root = process.env.QA_SMTP_ROOT;
  assert.ok(root);
  const dataDir = path.join(root, `cms-${port}`);
  const password = randomBytes(24).toString('base64url');
  const username = 'operator@example.test';
  const publishedContentPath = path.join(dataDir, 'published-content.json');
  setupContentAdmin({dataDir, username, password, publishedContentPath});
  const cms = createContentAdminServer({dataDir, publishedContentPath, publicUploadDir: path.join(dataDir, 'public-media'), allowedOrigin: origin, secureCookies: false, mailSender});
  await new Promise<void>((resolve, reject) => { cms.once('error', reject); cms.listen(0, '127.0.0.1', resolve); });
  const address = cms.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const headers: Record<string, string> = {Origin: origin, 'Content-Type': 'application/json'};
  const request = (route: string, body?: unknown, extra: Record<string, string> = {}) => fetch(base + route, {method: body === undefined ? 'GET' : 'POST', headers: {...headers, ...extra}, ...(body === undefined ? {} : {body: JSON.stringify(body)})});
  try {
    assert.equal((await request('/api/cms/inquiries')).status, 401);
    const input = {name: 'Loopback QA', businessEmail: recipient, company: 'Isolated QA', market: 'France', category: 'eye', sku: 'GT-EYE-001', configuration: 'White', quantity: '1000', budget: 'To discuss', launchDate: '2027', productGoal: 'Eye care', packagingPreference: 'Jar', certificationConstraints: '', notes: 'Loopback SMTP verification only', privacyConsent: true};
    const submission = await request('/api/inquiries', input, {'Idempotency-Key': `smtp-loopback-${port}`, 'X-Inquiry-Locale': 'fr'});
    assert.equal(submission.status, 202);
    const created = await submission.json() as {id: string; accessToken: string};
    const recordPath = `/api/cms/inquiries/${created.id}`;
    const login = await request('/api/cms/auth/login', {username, password});
    assert.equal(login.status, 200);
    headers.Cookie = login.headers.get('set-cookie')!.split(';', 1)[0];
    const session = await login.json() as {csrfToken: string};
    assert.equal((await request(`${recordPath}/send`, {})).status, 403);
    headers['X-CSRF-Token'] = session.csrfToken;
    assert.equal((await request(`${recordPath}/send`, {})).status, 409);
    const pending = await (await request(recordPath)).json() as StoredInquiry;
    assert.equal((await request(`${recordPath}/approve`, {version: pending.version, confirmed: true})).status, 200);
    const failedResponse = await request(`${recordPath}/send`, {});
    assert.equal(failedResponse.status, 200);
    const failed = await failedResponse.json() as StoredInquiry;
    assert.equal(failed.email.status, 'retryable_error');
    assert.equal(failed.delivery.error, 'SMTP_SEND_FAILED');
    assert.equal(failed.delivery.attempts, 1);
    assert.ok(!JSON.stringify(failed).includes(process.env.QA_SMTP_PASSWORD!));
    const retryResponse = await request(`${recordPath}/send`, {});
    assert.equal(retryResponse.status, 200);
    const accepted = await retryResponse.json() as StoredInquiry;
    assert.equal(accepted.email.status, 'sent');
    assert.equal(accepted.delivery.attempts, 2);
    const repeat = await (await request(`${recordPath}/send`, {})).json() as StoredInquiry;
    assert.equal(repeat.delivery.attempts, 2);
    const publicStatus = await (await request(`/api/inquiries/${created.id}/status`, undefined, {Authorization: `Bearer ${created.accessToken}`})).json() as Record<string, unknown>;
    assert.equal(publicStatus.emailStatus, 'sent');
    assert.equal(publicStatus.input, undefined);
    process.stdout.write(JSON.stringify({port, apiAuthenticationEnforced: true, csrfEnforced: true, reviewRequired: true, failedThenManualRetry: true, duplicateSendSuppressed: true, privateStatus: true, externalMailSent: false}));
  } finally {
    cms.closeAllConnections();
    await new Promise<void>((resolve) => cms.close(() => resolve()));
  }
}

async function execute(command: string, args: string[], env: NodeJS.ProcessEnv = process.env): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {env, windowsHide: true, shell: false});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    const timeout = setTimeout(() => child.kill(), 90_000);
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve(stdout);
      else reject(new Error(`Loopback verifier process exited ${code}: ${stderr}`));
    });
  });
}

async function main() {
  await mkdir('tmp', {recursive: true});
  const root = await mkdtemp(path.resolve('tmp', 'smtp-loopback-'));
  const keyPath = path.join(root, 'private-test-key.pem');
  const certPath = path.join(root, 'local-test-cert.pem');
  await execute(process.env.OPENSSL_BIN ?? 'openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', certPath, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1']);
  const tlsOptions = {key: await readFile(keyPath), cert: await readFile(certPath)};
  const context = createSecureContext(tlsOptions);
  const results = [];
  for (const port of [465, 587]) {
    const password = randomBytes(24).toString('base64url');
    const sockets = new Set<Socket>();
    const observed = {encryptedAuth: 0, dataAttempts: 0, acceptedMessages: 0, startTls: 0, invalidCommands: 0};
    const connected = (socket: Socket, encrypted: boolean, greeting = true) => {
      sockets.add(socket);
      socket.on('error', () => { /* Expected for the untrusted-certificate negative control. */ });
      socket.once('close', () => sockets.delete(socket));
      let buffer = '';
      let authenticated = false;
      let inData = false;
      let envelopeRecipient = '';
      let body = '';
      const rejectCommand = () => { observed.invalidCommands++; socket.end('550 Unexpected QA command\r\n'); };
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString();
        while (buffer.includes('\r\n')) {
          const end = buffer.indexOf('\r\n');
          const line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (inData) {
            if (line !== '.') { body += line + '\r\n'; continue; }
            inData = false;
            observed.dataAttempts++;
            if (!encrypted || !authenticated || envelopeRecipient !== recipient || !body.includes(`To: ${recipient}`) || !body.includes('Message-ID:')) { rejectCommand(); continue; }
            if (observed.dataAttempts === 1) socket.write('451 4.3.0 Simulated temporary local failure\r\n');
            else { observed.acceptedMessages++; socket.write('250 2.0.0 Accepted by loopback QA only\r\n'); }
          } else if (/^EHLO /i.test(line)) {
            socket.write(encrypted ? '250-localhost\r\n250 AUTH PLAIN\r\n' : '250-localhost\r\n250 STARTTLS\r\n');
          } else if (line === 'STARTTLS' && !encrypted && port === 587) {
            observed.startTls++;
            socket.removeListener('data', onData);
            socket.write('220 Ready for TLS\r\n', () => connected(new TLSSocket(socket, {isServer: true, secureContext: context}), true, false));
            return;
          } else if (line.startsWith('AUTH PLAIN ') && encrypted) {
            const [, user, supplied] = Buffer.from(line.slice(11), 'base64').toString().split('\0');
            if (user !== 'local-qa' || supplied !== password) { rejectCommand(); continue; }
            authenticated = true;
            observed.encryptedAuth++;
            socket.write('235 2.7.0 Authenticated\r\n');
          } else if (line === `MAIL FROM:<${senderAddress}>` && authenticated) {
            body = '';
            socket.write('250 OK\r\n');
          } else if (line === `RCPT TO:<${recipient}>` && authenticated) {
            envelopeRecipient = recipient;
            socket.write('250 OK\r\n');
          } else if (line === 'DATA' && authenticated) {
            inData = true;
            socket.write('354 End with dot\r\n');
          } else if (line === 'QUIT') socket.end('221 Bye\r\n');
          else if (line === 'RSET') socket.write('250 OK\r\n');
          else rejectCommand();
        }
      };
      socket.on('data', onData);
      if (greeting) socket.write('220 localhost loopback SMTP QA\r\n');
    };
    const server = port === 465 ? createTlsServer(tlsOptions, (socket) => connected(socket, true)) : createTcpServer((socket) => connected(socket, false));
    server.on('tlsClientError', () => { /* Certificate rejection is deliberately tested. */ });
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    try {
      const env: NodeJS.ProcessEnv = {...process.env, QA_SMTP_ROOT: root, QA_SMTP_PORT: String(port), QA_SMTP_PASSWORD: password};
      delete env.NODE_EXTRA_CA_CERTS;
      const script = fileURLToPath(import.meta.url);
      const negative = JSON.parse(await execute(process.execPath, ['--import', 'tsx', script, '--client', '--untrusted'], env));
      assert.equal(observed.encryptedAuth, 0);
      const positive = JSON.parse(await execute(process.execPath, ['--import', 'tsx', script, '--client'], {...env, NODE_EXTRA_CA_CERTS: certPath}));
      assert.equal(observed.encryptedAuth, 2);
      assert.equal(observed.dataAttempts, 2);
      assert.equal(observed.acceptedMessages, 1);
      assert.equal(observed.invalidCommands, 0);
      assert.equal(observed.startTls, port === 587 ? 3 : 0);
      results.push({...negative, ...positive, ...observed});
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
  const output = path.resolve('output', 'delivery-completion-final', 'smtp-loopback.json');
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, JSON.stringify({generatedAt: new Date().toISOString(), scope: 'Actual nodemailer SMTP against loopback-only TLS endpoints; no external mail delivery', results}, null, 2));
  process.stdout.write(`Loopback SMTP verification passed for TLS 465 and STARTTLS 587. Evidence: ${output}\n`);
}

if (process.argv.includes('--client')) await childClient();
else await main();
