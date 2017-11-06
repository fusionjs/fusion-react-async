import React from 'react';

import isReactCompositeComponent from './utils/isReactCompositeComponent';
import {isPrepared, getPrepare} from './prepared';

function renderCompositeElementInstance(instance, context = {}) {
  const childContext = Object.assign(
    {},
    context,
    instance.getChildContext ? instance.getChildContext() : {}
  );
  if (instance.componentWillMount) {
    instance.componentWillMount();
  }
  const children = instance.render();
  return [children, childContext];
}

function prepareCompositeElement({type, props}, context) {
  if (!isPrepared(type)) {
    return Promise.resolve({});
  }
  const prepareConfig = getPrepare(type);
  // If the component is deferred, skip the prepare step
  if (prepareConfig.defer) {
    return Promise.resolve(prepareConfig);
  }
  return prepareConfig.prepare(props, context).then(() => {
    return prepareConfig;
  });
}

function prepareElement(element, context) {
  if (element === null || typeof element !== 'object') {
    return Promise.resolve([null, context]);
  }
  const {type, props} = element;
  if (typeof type === 'string') {
    return Promise.resolve([props.children, context]);
  }
  if (!isReactCompositeComponent(type)) {
    return Promise.resolve([type(props, context), context]);
  }
  return prepareCompositeElement(element, context).then(prepareConfig => {
    // Stop traversing if the component is defer or boundary
    if (prepareConfig.defer || prepareConfig.boundary) {
      return Promise.resolve([null, context]);
    }
    const CompositeComponent = type;
    return renderCompositeElementInstance(
      new CompositeComponent(props, context),
      context
    );
  });
}

// TODO We can optimize this algorithm I think
function _prepare(element, context) {
  return prepareElement(element, context).then(([children, childContext]) => {
    return Promise.all(
      React.Children
        .toArray(children)
        .map(child => _prepare(child, childContext))
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
