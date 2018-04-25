/*!
 * plugins.js - basic utilities for bpanel
 * Copyright (c) 2018, Bcoin Devs (MIT License).
 * https://github.com/bcoin-org/bpanel-utils
 */

'use strict';

// sort plugins given their metadata
// first sorts by order property then name
export const comparePlugins = (pluginA, pluginB) => {
  // first sort by order, if order is same then order by name
  if (pluginA.order > pluginB.order) {
    return 1;
  } else if (pluginA.order < pluginB.order) {
    return -1;
  } else if (pluginA.name > pluginB.name) {
    return 1;
  } else if (pluginA.name < pluginB.name) {
    return -1;
  } else {
    return 0;
  }
};

export default { comparePlugins };
