// Mock minimali di req/res in stile Vercel serverless, per chiamare gli
// handler direttamente (nessun server reale, nessuna chiamata di rete).

export function createMockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    ended: false,
  };
  res.setHeader = (key, value) => { res.headers[key] = value; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
  res.end = () => { res.ended = true; return res; };
  return res;
}

export function createMockReq({ method = 'POST', body = {}, ip = '127.0.0.1' } = {}) {
  return {
    method,
    body,
    headers: { 'x-forwarded-for': ip },
  };
}
