/* eslint-env node */

process.on('unhandledRejection', e => {
  throw e;
});
import "./__node__/tests/prepare-render.js";
import "./__node__/tests/prepare-context.js";
import "./__node__/tests/split.js";
