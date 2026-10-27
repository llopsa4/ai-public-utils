import { generate } from './core.mjs';
self.onmessage = ({ data }) => {
  try {
    const result = generate(data.state, data.month, { timeMs: data.timeMs, onProgress: proposal => self.postMessage({ type: 'progress', ...proposal }) });
    self.postMessage({ type: 'done', ...result });
  } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
};
