const React = require('react');

module.exports = {
  CartesianChart: (props) => React.createElement('View', null, typeof props.children === 'function' ? null : props.children),
  Line: (props) => React.createElement('View', props),
  Bar: (props) => React.createElement('View', props),
  Area: (props) => React.createElement('View', props),
};
