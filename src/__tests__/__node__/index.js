/* eslint-env node */

process.on('unhandledRejection', e => {
  throw e;
});
import './tests/prepare-render.js';
import './tests/prepare-context.js';
import './tests/split.js';
