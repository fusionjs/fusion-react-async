# fusion-react-async

If an application grows too much in size, one way to help reduce the size of
the initial download is to split parts of the application into separate bundles
and download those only when they are needed. This technique is known
as bundle splitting.

---

## Fusion usage

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

## API

### split

```js
const Component = split({load, LoadingComponent, ErrorComponent});
```

- `load: () => Promise` - Load a component asynchronously. Typically, this should make a dynamic `import()` call.
  The Fusion compiler takes care of bundling the appropriate code and de-duplicating dependencies. The argument to `import` should be a string literal (not a variable). See [webpack docs](https://webpack.js.org/api/module-methods/#import-) for more information.
- `LoadingComponent` - A component to be displayed while the asynchronous component hasn't downloaded
- `ErrorComponent` - A component to be displayed if the asynchronous component could not be loaded
- `Component` - A placeholder component that can be used in your view which will show the asynchronous component

---

### Design

`react-prepare` allows you to have you deeply nested components with asynchronous dependencies, and have everything just work with server-side rendering.

The typical use-case is when a deeply-nested component needs to have a resource fetched from a remote HTTP server, such as GraphQL or REST API. Since `renderToString` is synchronous, when you call it on your app, this component won't render correctly.

One solution is to have a central router at the root of your application that knows exactly what data needs to be fetched before rendering. But this solution doesn't fit the component-based architecture of a typical React app. You want to declare data dependencies at the component level, much like your declare your props.

This is exactly what `react-prepare` does: it allows you to declare asynchronous dependencies at the component level, and make them work fine with server-side rendering as well as client-side rendering.

`react-prepare` is agnostic and can be used vanilla, but it comes with a tiny helper that makes it extremely easy to use along `redux` and `react-redux` (see examples below).

#### Example with `react-redux`

Let's assume you have defined an async action creator `fetchTodoItems(userName)` which performs HTTP request to your server to retrieve the todo items for a given user and stores the result in your redux state.

Your `TodoList` component definition would look like this:

```js
import { dispatched } from 'react-prepare';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { fetchTodoItems } from './actions';

const enhance = compose(
  dispatched(({ userName }, dispatch) => dispatch(fetchTodoItems(userName))),
  connect(({ todoItems }) => ({ items: todoItems }),
);

const TodoList = ({ items }) => <ul>{items.map((item, key) =>
  <li key={key}>{item}</li>
</ul>}</ul>;

export default enhance(TodoList);
```

And your server-side rendering code would look like this:

```js
import { renderToString } from 'react-dom/server';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import prepare from 'react-prepare';

import reducer from './reducer';

async function serverSideRender(userName) {
  const store = createStore(reducer, applyMiddleware(thunkMiddleware));
  const app = <Provider store={store}>
    <TodoList userName={userName} />
  </Provider>;
  await prepare(app);
  return {
    html: renderToString(app),
    state: store.getState(),
  };
}
```

Your client could re-use the data fetched during server-side rendering directly, eg. assuming your injected it in `window.__APP_STATE__`:

```js
const store = createStore(reducer, JSON.parse(window.__APP_STATE__));
render(<Provider store={store}>
  <TodoList userName={userName} />
</Provider>, document.getElementById('app'));
```

**For a complete example of a fully-functional app using `react-prepare` in conjunction with `redux`, see the [react-prepare-todo](https://github.com/elierotenberg/react-prepare-todo) repository.**

### API

#### `dispatched(sideEffect: async(props, dispatch), opts)(Component)`

Helper to use `prepared` more simply if your side effects consists mostly of dispatching redux actions.

In the body of the `sideEffect` function, you can use the `dispatch` function to dispatch redux actions, typically
requesting data from an asynchronous source (API server, etc.).
For example, let's assume you have defined an async action creator `fetchTodoItems(userName)` that fetches the todo-items from a REST API,
and that you are defining a component with a `userName` prop. To decorate your component, your code would look like:

```js
class TodoItems extends React.PureComponent { ... }

const DispatchedTodoItems = dispatched(
  ({ userName }, dispatch) => dispatch(fetchTodoItems(userName))
)(TodoItems);
```

The decorated component will have the following behavior:

- when server-side rendered using `prepare`, `sideEffect` will be run and awaited before the component is rendered; if `sideEffect` throws, `prepare` will also throw.
- when client-side rendered, `sideEffect` will be called on `componentDidMount` and `componentWillReceiveProps`.

`opts` is an optional configuration object passed directly to the underlying `prepared` decorator (see below).

#### `prepared(sideEffect: async(props, context), opts)(Component)`

Decorates `Component` so that when `prepare` is called, `sideEffect` is called (and awaited) before continuing the rendering traversal.

Available `opts` is an optional configuration object:

- `opts.pure` (default: `true`): the decorated component extends `PureComponent` instead of `Component`.
- `opts.componentDidMount` (default: `true`): on the client, `sideEffect` is called when the component is mounted.
- `opts.componentWillReceiveProps` (default: `true`): on the client, `sideEffect` is called again whenever the component receive props.

#### `async prepare(Element)`

Recursively traverses the element rendering tree and awaits the side effects of components decorated with `prepared` (or `dispatched`).
It should be used (and `await`-ed) *before* calling `renderToString` on the server. If any of the side effects throws, `prepare` will also throw.

### Notes

`react-prepare` tries hard to avoid object keys conflicts, but since React isn't very friendly with `Symbol`, it uses a special key for its internal use.
The single polluted key in the components key namespace is `@__REACT_PREPARE__@`, which shouldn't be an issue.

---
