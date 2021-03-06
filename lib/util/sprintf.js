/*
 *  Copyright 2011 Rackspace
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

var cache = {};


// Do any others need escaping?
var TO_ESCAPE = {
  '\'': '\\\'',
  '\n': '\\n'
};


function populate(formatter) {
  // TODO: In theory we only need to do this traverse once, but we have to
  // handle escaping, etc, so its not especially clean
  if (formatter.indexOf('%(') >= 0) {
    populateNamed(formatter);
  } else {
    populatePositional(formatter);
  }
}


function populateNamed(formatter) {
  var i, type, key,
      prev = 0,
      builder = 'return \'';

  for (i = 0; i < formatter.length; i++) {
    if (formatter[i] === '%' && formatter[i + 1] === '(') {
      key = formatter.slice(i + 2, i + 2 + formatter.slice(i + 2).indexOf(')'));
      type = formatter[i + key.length + 3];
      switch (type) {
        case 's':
          builder += formatter.slice(prev, i) + '\' + arguments[1][\'' + key + '\'] + \'';
          i += key.length + 3;
          prev = i + 1;
          break;
        case 'j':
          builder += formatter.slice(prev, i) + '\' + JSON.stringify(arguments[1][\'' + key + '\']) + \'';
          i += key.length + 3;
          prev = i + 1;
          break;
      }
    } else if (TO_ESCAPE[formatter[i]]) {
      builder += formatter.slice(prev, i) + TO_ESCAPE[formatter[i]];
      prev = i + 1;
    }
  }

  builder += formatter.slice(prev) + '\';';
  cache[formatter] = new Function(builder);
}


function populatePositional(formatter) {
  var i, type,
      prev = 0,
      arg = 1,
      builder = 'return \'';

  for (i = 0; i < formatter.length; i++) {
    if (formatter[i] === '%') {
      type = formatter[i + 1];

      switch (type) {
        case 's':
          builder += formatter.slice(prev, i) + '\' + arguments[' + arg + '] + \'';
          prev = i + 2;
          arg++;
          break;
        case 'j':
          builder += formatter.slice(prev, i) + '\' + JSON.stringify(arguments[' + arg + ']) + \'';
          prev = i + 2;
          arg++;
          break;
        case '%':
          builder += formatter.slice(prev, i + 1);
          prev = i + 2;
          i++;
          break;
      }


    } else if (TO_ESCAPE[formatter[i]]) {
      builder += formatter.slice(prev, i) + TO_ESCAPE[formatter[i]];
      prev = i + 1;
    }
  }

  builder += formatter.slice(prev) + '\';';
  cache[formatter] = new Function(builder);
}


/**
 * A fast version of sprintf(), which currently only supports the %s and %j.
 * This caches a formatting function for each format string that is used, so
 * you should only use this sprintf() will be called many times with a single
 * format string and a limited number of format strings will ever be used (in
 * general this means that format strings should be string literals).
 *
 * @param {String} formatter A format string.
 * @param {...String} var_args Values that will be formatted by %s and %j.
 * @return {String} The formatted output.
 */
module.exports = function(formatter, var_args) {
  if (!cache[formatter]) {
    populate(formatter);
  }

  return cache[formatter].apply(null, arguments);
};
