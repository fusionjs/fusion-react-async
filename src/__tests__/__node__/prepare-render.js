/* eslint-disable react/no-multi-comp */
import tape from 'tape-cup';
import React, {Component} from 'react';
import {prepare, prepared} from '../../index.js';

tape('Preparing a sync app', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends Component {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numConstructors++;
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational() {
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

tape('Preparing a sync app with nested children', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends Component {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numConstructors++;
    }
    render() {
      numRenders++;
      return (
        <div>
          {this.props.children}
        </div>
      );
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const app = (
    <SimpleComponent>
      <SimplePresentational />;
    </SimpleComponent>
  );
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});

tape(
  'Preparing a sync app with functional components referencing children',
  t => {
    let numRenders = 0;
    let numChildRenders = 0;
    let numPrepares = 0;
    function SimpleComponent(props, context) {
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numRenders++;
      return (
        <div>
          {props.children}
        </div>
      );
    }
    function SimplePresentational() {
      numChildRenders++;
      return <div>Hello World</div>;
    }
    const AsyncChild = prepared(props => {
      numPrepares++;
      t.equal(
        props.data,
        'test',
        'passes props through to prepared component correctly'
      );
      return Promise.resolve();
    })(SimplePresentational);
    const app = (
      <SimpleComponent>
        <AsyncChild data="test" />
      </SimpleComponent>
    );
    const p = prepare(app);
    t.ok(p instanceof Promise, 'prepare returns a promise');
    p.then(() => {
      t.equal(numRenders, 1, 'renders SimpleComponent once');
      t.equal(numPrepares, 1, 'runs prepare function once');
      t.equal(numChildRenders, 1, 'renders SimplePresentational once');
      t.end();
    });
  }
);

tape('Preparing an async app', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numConstructors++;
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 1, 'runs the prepare function once');
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});

tape('Preparing an async app with nested asyncs', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numConstructors++;
    }
    render() {
      numRenders++;
      return <div>{this.props.children}</div>;
    }
  }

  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimpleComponent);
  const app = (
    <AsyncParent data="test">
      <AsyncParent data="test">
        <SimplePresentational />
      </AsyncParent>
    </AsyncParent>
  );

  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 2, 'runs each prepare function once');
    t.equal(
      numConstructors,
      2,
      'constructs SimpleComponent once for each render'
    );
    t.equal(numRenders, 2, 'renders SimpleComponent twice');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});

tape('Preparing an app with sibling async components', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numConstructors++;
    }
    render() {
      numRenders++;
      return <div>{this.props.children}</div>;
    }
  }

  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimpleComponent);
  const app = (
    <div>
      <AsyncParent data="test">
        <SimplePresentational />
      </AsyncParent>
      <AsyncParent data="test">
        <SimplePresentational />
      </AsyncParent>
    </div>
  );

  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 2, 'runs each prepare function once');
    t.equal(
      numConstructors,
      2,
      'constructs SimpleComponent once for each render'
    );
    t.equal(numRenders, 2, 'renders SimpleComponent twice');
    t.equal(
      numChildRenders,
      2,
      'renders SimplePresentational once for each render'
    );
    t.end();
  });
});

tape('Rendering a component triggers componentWillMount before render', t => {
  const orderedMethodCalls = [];
  const orderedChildMethodCalls = [];

  class SimpleComponent extends Component {
    componentWillMount() {
      orderedMethodCalls.push('componentWillMount');
    }

    render() {
      orderedMethodCalls.push('render');
      return <SimpleChildComponent />;
    }
  }

  class SimpleChildComponent extends Component {
    componentWillMount() {
      orderedChildMethodCalls.push('componentWillMount');
    }

    render() {
      orderedChildMethodCalls.push('render');
      return <div>Hello World</div>;
    }
  }

  const app = <SimpleComponent />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.deepEqual(orderedMethodCalls, ['componentWillMount', 'render']);
    t.deepEqual(orderedChildMethodCalls, ['componentWillMount', 'render']);
    t.end();
  });
});
