/**
 * Mock for @react-native-community/datetimepicker.
 */
const React = require('react');

const MockDateTimePicker = (props) => {
  return React.createElement('DateTimePicker', props);
};

module.exports = { default: MockDateTimePicker };
