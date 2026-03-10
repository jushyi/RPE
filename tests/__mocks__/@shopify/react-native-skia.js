const React = require('react');

const mockFont = { getSize: jest.fn(() => 12) };

module.exports = {
  useFont: jest.fn(() => mockFont),
  Canvas: (props) => React.createElement('View', props),
  Path: (props) => React.createElement('View', props),
  Text: (props) => React.createElement('View', props),
  Line: (props) => React.createElement('View', props),
  Circle: (props) => React.createElement('View', props),
  Group: (props) => React.createElement('View', props),
  Skia: {
    Path: { Make: jest.fn() },
  },
};
