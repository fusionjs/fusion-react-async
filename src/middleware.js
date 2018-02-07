/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
