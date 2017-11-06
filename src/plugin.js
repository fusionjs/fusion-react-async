import React from 'react';
import PrepareProvider from './prepare-provider';
function preparePlugin(ctx, next) {
  if (__NODE__ && !ctx.element) {
    return next();
  }
  ctx.element = (
    <PrepareProvider preloadChunks={ctx.preloadChunks}>
      {ctx.element}
    </PrepareProvider>
  );
  return next();
}

// wrap in function in case we need to take config in the future
export default () => preparePlugin;
