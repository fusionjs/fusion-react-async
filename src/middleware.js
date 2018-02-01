import React from 'react';
import PrepareProvider from './prepare-provider';
export default function(ctx, next) {
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
