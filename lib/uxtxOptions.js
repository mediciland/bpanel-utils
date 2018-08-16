// initial label values
// NOTE: many are the same, but
// they are decoupled
const labels = {
  WITHDRAW: 'Sent',
  DEPOSIT: 'Received',
  COINBASE: 'Coinbase',
  MULTIPLE_OUTPUT: 'Multiple',
  MULTIPLE_ADDRESS: 'Multiple',
  MULTIPLE_ACCOUNT: 'Multiple',
  UNKNOWN_ADDRESS: 'Unknown',
  UNKNOWN_ACCOUNT: 'Unknown',
};

// initial constants
const constants = {
  DATE_FORMAT: 'MM/DD/YY hh:mm a',
};

// additional options for UXTX
const UXTXOptions = {
  constants,
  labels,
  json: null, // tx json
};

export default UXTXOptions;
