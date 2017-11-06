import prepared from './prepared.js';

// Stops the traversal at this node. Useful for optimizing the prepare traversal
// to visit the minimum number of nodes
export default prepared(Promise.resolve(), {
  componentDidMount: false,
  componentWillReceiveProps: false,
  defer: true,
});
