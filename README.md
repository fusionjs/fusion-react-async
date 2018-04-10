# fusion-react-async

[![Build status](https://badge.buildkite.com/7037953b28b5737bad5844360b3ceef38b3aab09b6fd31587d.svg?branch=master)](https://buildkite.com/uberopensource/fusion-react-async)

This package allows you to have deeply nested components with asynchronous dependencies and have everything just work with server-side rendering.

The typical use-case is when a deeply-nested component needs to have a resource fetched from a remote HTTP server, such as GraphQL or REST API. Since `renderToString` is synchronous, when you call it on your app, this component won't render correctly.

One solution is to have a central router at the root of your application that knows exactly what data needs to be fetched before rendering. But this solution doesn't fit the component-based architecture of a typical React app. You want to declare data dependencies at the component level, much like your declare your props.

This is exactly what `fusion-react-async` does: it allows you to declare asynchronous dependencies at the component level, and make them work fine with server-side rendering as well as client-side rendering.

If an application grows too much in size, one way to help reduce the size of the initial download is to split parts of the application into separate bundles and download those only when they are needed. This technique is known
as bundle splitting and `fusion-react-async` provides tools to do it easily.

---

### Examples

#### Data fetching

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import Example from './components/example';
import UserAPI from './api'

export default () => {
  const app = new App(<Example />);

  app.register(UserAPI);

  return app;
}

// src/components/example.js
import {prepared} from 'fusion-react-async';

function Example({name}) {
  return <div>Hello, {name}</div>;
}

export default prepared(() => fetch('/api/user/1'))(Example);

// src/api.js
import {createPlugin} from 'fusion-core';

export default createPlugin({
  middleware() {
    return (ctx, next) => {
      if (ctx.path === '/api/user/1') {
        ctx.body = {name: 'Bob'};
      }
      return next();
    };
  }
});
```

#### Bundle splitting

```js
// src/main.js
import App from 'fusion-react';
import root from './components/root';

export default () => {
  return new App(root);
}

// src/components/root.js
import React from 'react';
import {split} from 'fusion-react-async';

const LoadingComponent = () => <div>Loading...</div>;
const ErrorComponent = () => <div>Error loading component</div>;
const BundleSplit = split({
  load: () => import('./components/hello');
  LoadingComponent,
  ErrorComponent
});

const root = (
  <div>
    <div>This is part of the initial bundle</div>
    <BundleSplit />
  </div>
)

export default root;

// src/components/hello.js
export default () => (
  <div>
    This is part of a separate bundle that gets loaded asynchronously
    when the BundleSplit component gets mounted
  </div>
)
```

---

### API

#### middleware

```js
import { middleware } from 'fusion-react-async';
```

A middleware that adds a `PrepareProvider` to the React tree.

Consider using [`fusion-react`](https://github.com/fusionjs/fusion-react) instead of setting up React and registering this middleware manually, since that package does all of that for you.

#### split

```js
import { split } from 'fusion-react-async';

const Component = split({ load, LoadingComponent, ErrorComponent });
```

* `load: () => Promise` - Required. Load a component asynchronously. Typically, this should make a dynamic `import()` call.
  The Fusion compiler takes care of bundling the appropriate code and de-duplicating dependencies. The argument to `import` should be a string literal (not a variable). See [webpack docs](https://webpack.js.org/api/module-methods/#import-) for more information.
* `LoadingComponent` - Required. A component to be displayed while the asynchronous component hasn't downloaded
* `ErrorComponent` - Required. A component to be displayed if the asynchronous component could not be loaded
* `Component` - A placeholder component that can be used in your view which will show the asynchronous component

#### prepare

```js
import { prepare } from 'fusion-react-async';

const Component = prepare(element);
```

* `Element: React.Element` - Required. A React element created via `React.createElement`
* `Component: React.Component` - A React component

Consider using [`fusion-react`](https://github.com/fusionjs/fusion-react) instead of setting up React manually and calling `prepare` directly, since that package does all of that for you.

The `prepare` function recursively traverses the element rendering tree and awaits the side effects of components decorated with `prepared` (or `dispatched`).

It should be used (and `await`-ed) _before_ calling `renderToString` on the server. If any of the side effects throws, `prepare` will also throw.

#### prepared

```js
import { prepared } from 'fusion-react-async';

const hoc = prepared(sideEffect, opts);
```

* `sideEffect: : (props: Object, context: Object) => Promise` - Required. when `prepare` is called, `sideEffect` is called (and awaited) before continuing the rendering traversal.
* `opts: {defer, boundary, componentDidMount, componentWillReceiveProps, componentDidUpdate, forceUpdate, contextTypes}` - Optional
  * `defer: boolean` - Optional. Defaults to `true`. If the component is deferred, skip the prepare step
  * `boundary: boolean` - Optional. Defaults to `false`. Stop traversing if the component is defer or boundary
  * `componentDidMount: boolean` - Optional. Defaults to `true`. On the browser, `sideEffect` is called when the component is mounted.
  * [TO BE DEPRECATED] `componentWillReceiveProps: boolean` - Optional. Defaults to `false`. On the browser, `sideEffect` is called again whenever the component receive props.
  * `componentDidUpdate: boolean` - Optional. Defaults to `false`. On the browser, `sideEffect` is called again right after updating occurs.
  * `forceUpdate: boolean` - Optional. Defaults to `false`.
  * `contextTypes: Object` - Optional. Custom React context types to add to the prepared component.
* `hoc: (Component: React.Component) => React.Component` - A higher-order component that returns a component that awaits for async side effects before rendering
  * `Component: React.Component` - Required.

#### exclude

```js
import { exclude } from 'fusion-react-async';

const NewComponent = exclude(Component);
```

* `Component: React.Component` - Required. A component that should not be traversed via `prepare`.
* `NewComponent: React.Component` - A component that is excluded from `prepare` traversal.

Stops `prepare` traversal at `Component`. Useful for optimizing the `prepare` traversal to visit the minimum number of nodes.
