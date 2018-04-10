/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {isFragment, isContextConsumer, isContextProvider} from 'react-is';

import isReactCompositeComponent from './utils/isReactCompositeComponent';
import {isPrepared, getPrepare} from './prepared';

function renderCompositeElementInstance(instance) {
  const childContext = Object.assign(
    {},
    instance.context,
    instance.getChildContext ? instance.getChildContext() : {}
  );
  if (instance.componentWillMount) {
    instance.componentWillMount();
  }
  const children = instance.render();
  return [children, childContext];
}

function prepareComponentInstance(instance) {
  if (!isPrepared(instance)) {
    return Promise.resolve({});
  }
  const prepareConfig = getPrepare(instance);
  // If the component is deferred, skip the prepare step
  if (prepareConfig.defer) {
    return Promise.resolve(prepareConfig);
  }
  return prepareConfig.prepare(instance.props, instance.context).then(() => {
    return prepareConfig;
  });
}

function prepareElement(element, context) {
  if (element === null || typeof element !== 'object') {
    return Promise.resolve([null, context]);
  }
  const {type, props} = element;
  if (
    typeof type === 'string' ||
    isFragment(element) ||
    isContextConsumer(element) ||
    isContextProvider(element)
  ) {
    return Promise.resolve([props.children, context]);
  }
  if (!isReactCompositeComponent(type)) {
    return Promise.resolve([type(props, context), context]);
  }
  const CompositeComponent = type;
  const instance = new CompositeComponent(props, context);
  instance.props = props;
  instance.context = context;
  return prepareComponentInstance(instance, context).then(prepareConfig => {
    // Stop traversing if the component is defer or boundary
    if (prepareConfig.defer || prepareConfig.boundary) {
      return Promise.resolve([null, context]);
    }
    return renderCompositeElementInstance(instance);
  });
}

// TODO(#4) We can optimize this algorithm I think
function _prepare(element, context) {
  return prepareElement(element, context).then(([children, childContext]) => {
    return Promise.all(
      React.Children.toArray(children).map(child =>
        _prepare(child, childContext)
      )
    );
  });
}

function prepare(element, context = {}) {
  context.__IS_PREPARE__ = true;
  return _prepare(element, context).then(() => {
    context.__IS_PREPARE__ = false;
  });
}

export default prepare;
