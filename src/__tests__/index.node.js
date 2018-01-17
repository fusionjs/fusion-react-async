/* eslint-env node */

process.on('unhandledRejection', e => {
  throw e;
});
import './__node__/prepare-render.node.js';
import './__node__/prepare-context.node.js';
import './__node__/split.node.js';
