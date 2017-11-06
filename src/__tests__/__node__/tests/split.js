/* eslint-disable react/no-multi-comp */
import tape from 'tape-cup';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {split} from '../../../index.js';
import {REACT_PREPARE} from '../../../constants.js';
import Provider from '../../../prepare-provider';

tape('Preparing an app with an async component', t => {
  function DeferredComponent() {
    return <div>Loaded</div>;
  }
  function LoadingComponent() {
    return <div>Loading</div>;
  }
  function ErrorComponent() {
    return <div>Failed</div>;
  }

  const ToTest = split({
    defer: true,
    load: () => Promise.resolve({default: DeferredComponent}),
    LoadingComponent,
    ErrorComponent,
  });

  const contextualized = <Provider preloadChunks={[]}><ToTest /></Provider>;

  t.ok(/Loading/.test(renderToString(contextualized)), 'starts off loading');
  ToTest[REACT_PREPARE]
    .prepare(
      {},
      {
        preloadChunks: [],
        splitComponentLoaders: [],
      }
    )
    .then(function() {
      t.ok(/Loaded/.test(renderToString(contextualized)), 'ends loaded');
      t.end();
    });
});

tape('Preparing an app with an errored async component', t => {
  function LoadingComponent() {
    return <div>Loading</div>;
  }
  function ErrorComponent() {
    return <div>Failed</div>;
  }

  const ToTest = split({
    defer: true,
    load: () => Promise.reject(new Error('failed')),
    LoadingComponent,
    ErrorComponent,
  });

  const contextualized = <Provider preloadChunks={[]}><ToTest /></Provider>;

  t.ok(/Loading/.test(renderToString(contextualized)), 'starts off loading');
  ToTest[REACT_PREPARE]
    .prepare(
      {},
      {
        preloadChunks: [],
        splitComponentLoaders: [],
      }
    )
    .then(function() {
      t.ok(/Failed/.test(renderToString(contextualized)), 'ends failed');
      t.end();
    });
});
