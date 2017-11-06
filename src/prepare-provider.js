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
