/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react/no-multi-comp */
import tape from 'tape-cup';
import React, {Component} from 'react';
import {prepare} from '../../index.js';

tape('Preparing a sync app passing through context', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends Component<any, any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numConstructors++;
    }
    getChildContext() {
      return {
        test: 'data',
      };
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational(props, context) {
    t.equal(context.test, 'data', 'handles child context correctly');
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const app = <SimpleComponent />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});
