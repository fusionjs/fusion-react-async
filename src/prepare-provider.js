/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

class PrepareProvider extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.splitComponentLoaders = [];
    this.preloadChunks = props.preloadChunks;
  }
  getChildContext() {
    return {
      splitComponentLoaders: this.splitComponentLoaders,
      preloadChunks: this.preloadChunks,
    };
  }
  render() {
    return React.Children.only(this.props.children);
  }
}

PrepareProvider.childContextTypes = {
  splitComponentLoaders: PropTypes.array.isRequired,
  preloadChunks: PropTypes.array.isRequired,
};

export default PrepareProvider;
