import { request } from 'node:http';

const maxUploadBytes = 15 * 1024 * 1024;
const maxResponseBytes = 32 * 1024 * 1024;

export const info = {
  id: 'indextts2-mobile',
  name: 'IndexTTS2 手机中继',
  description: '将手机本机酒馆的语音请求转发到指定的局域网 IndexTTS2。',
};

function errorResponse(res, status, detail) {
  return res.status(status).json({ detail });
}

function isLoopback(address) {
  const ip = address?.replace(/^::ffff:/, '');
  return ip === '::1' || /^127(?:\.\d{1,3}){3}$/.test(ip ?? '');
}

function forward(upstream, path, method, contentType, body, timeout) {
  return new Promise((resolve, reject) => {
    const req = request(upstream + path, {
      method,
      signal: AbortSignal.timeout(timeout),
      headers: body ? { 'Content-Type': contentType, 'Content-Length': body.length } : {},
    }, response => {
      const chunks = [];
      let bytes = 0;
      response.on('error', reject);
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > maxResponseBytes) {
          response.destroy(new Error('IndexTTS2 response too large'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({
        status: response.statusCode,
        contentType: response.headers['content-type'] || 'application/octet-stream',
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

async function relay(upstream, res, path, { method = 'GET', type, body, timeout = 5000 } = {}) {
  try {
    const result = await forward(upstream, path, method, type, body, timeout);
    if (result.status >= 300 && result.status < 400) {
      return errorResponse(res, 502, '电脑端语音服务返回了意外的跳转。');
    }
    if (!/^(?:application\/json|audio\/wav)(?:\s*;|$)/i.test(result.contentType)) {
      return errorResponse(res, 502, '电脑端语音服务返回了意外的格式。');
    }
    res.set('Content-Type', result.contentType).status(result.status).send(result.body);
  } catch (error) {
    const timedOut = error.code === 'ABORT_ERR' || error.name === 'TimeoutError';
    errorResponse(res, timedOut ? 504 : 502, timedOut ? '连接电脑的语音服务超时。' : '手机端中继未能连接电脑的 7880 端口。');
  }
}

export async function init(router) {
  const raw = process.env.INDEXTTS2_UPSTREAM;
  if (!raw) {
    console.log('[IndexTTS2] 请设置 INDEXTTS2_UPSTREAM 以启用手机中继。');
    return;
  }
  const upstream = new URL(raw);
  const isPrivate = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}(?:\.\d{1,3}){1,2}$/;
  if (upstream.protocol !== 'http:' || !isPrivate.test(upstream.hostname) || upstream.username || upstream.password
    || upstream.pathname !== '/' || upstream.search || upstream.hash || upstream.port !== '7880') {
    throw new Error('INDEXTTS2_UPSTREAM 必须是 http://局域网IPv4:7880。');
  }
  const target = upstream.origin;
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.headers.origin;
    const sameOrigin = !origin || origin === `${req.protocol}://${req.headers.host}`;
    if (!isLoopback(req.socket.remoteAddress) || !sameOrigin || req.headers['sec-fetch-site'] === 'cross-site') {
      return errorResponse(res, 403, '手机中继只能从这台设备自己的酒馆页面使用。');
    }
    next();
  });

  router.get('/status', (_req, res) => res.json({ bridge: info.id }));
  router.get('/voices', (_req, res) => relay(target, res, '/api/v1/voices'));

  router.post('/speech', (req, res) => {
    if (!req.is('application/json') || typeof req.body?.text !== 'string' || req.body.text.length > 4096) {
      return errorResponse(res, 400, '台词内容无效。');
    }
    const body = Buffer.from(JSON.stringify(req.body));
    if (body.length > 32768) return errorResponse(res, 413, '语音请求太大。');
    return relay(target, res, '/api/v1/tts/tasks', { method: 'POST', type: 'application/json', body, timeout: 250_000 });
  });

  router.post('/upload', async (req, res) => {
    const { filename, audio } = req.body ?? {};
    if (!req.is('application/json') || typeof filename !== 'string' || !filename || filename.length > 120
      || typeof audio !== 'string' || audio.length > Math.ceil(maxUploadBytes / 3) * 4
      || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio) || audio.length % 4 !== 0) {
      return errorResponse(res, 400, '参考音频无效或文件太大。');
    }

    const wav = Buffer.from(audio, 'base64');
    if (wav.length < 44 || wav.length > maxUploadBytes || wav.toString('ascii', 0, 4) !== 'RIFF'
      || wav.toString('ascii', 8, 12) !== 'WAVE') {
      return errorResponse(res, 415, '只接受 WAV 参考音频。');
    }

    const form = new FormData();
    form.set('file', new Blob([wav], { type: 'audio/wav' }), filename.replace(/[\\/\r\n]/g, '_'));
    const encoded = new Request(target, { method: 'POST', body: form });
    const body = Buffer.from(await encoded.arrayBuffer());
    return relay(target, res, '/api/v1/upload', { method: 'POST', type: encoded.headers.get('content-type'), body, timeout: 15_000 });
  });
}
