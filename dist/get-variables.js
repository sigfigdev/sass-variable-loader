'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getVariables;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _stripJsonComments = require('strip-json-comments');

var _stripJsonComments2 = _interopRequireDefault(_stripJsonComments);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var normalize = function normalize(content) {
  return (0, _stripJsonComments2.default)(content).replace(/!default|!important/g, '').trim();
};

var getImports = function getImports(content) {
  var scssImports = [];
  var importMatcher = /@import\s+["']([^"']*)["'];/g;

  var matches = void 0;
  // eslint-disable-next-line no-cond-assign
  while (matches = importMatcher.exec(content)) {
    scssImports.push(matches[1]);
  }

  return scssImports;
};

var resolveImports = function resolveImports(content, currentRequestPath) {
  var code = normalize(content);

  var fileImports = getImports(code).map(function (i) {
    return i.replace(/(\.scss)?$/, '.scss');
  });
  var importPaths = fileImports.map(function (i) {
    var fileToTry = _path2.default.resolve(_path2.default.dirname(currentRequestPath), i);
    if (_fs2.default.existsSync(fileToTry)) {
      return fileToTry;
    } else {
      // Add leading _ if file without doesn't exist
      var baseName = _path2.default.basename(i);
      var partialFileName = i.replace(new RegExp('_?' + baseName), '_' + baseName);
      return _path2.default.resolve(_path2.default.dirname(currentRequestPath), partialFileName);
    }
  });

  if (importPaths) {
    var importContent = importPaths.map(function (importPath) {
      return resolveImports(_fs2.default.readFileSync(importPath).toString(), importPath);
    }).join('\n');
    return importContent + code;
  } else {
    return code;
  }
};

var getValue = function getValue(line) {
  var variableRegex = /\$(.+):\s+(.+);?/;
  var mapRegex = /\$(.+):\s*\(([^)]*)\);?/;

  var map = mapRegex.exec(line);
  if (map) {
    return map[2].trim().split(',').reduce(function (prev, current) {
      if (current) {
        return Object.assign({}, prev, _defineProperty({}, current.match(/\w[^:]*/)[0], current.match(/:\s*([^;]*)/)[1]));
      }
      return prev;
    }, {});
  }
  var variable = variableRegex.exec(line);
  if (variable) {
    return variable[2].trim();
  }
  return "'";
};

function getVariables(content, currentRequestPath) {
  var keyRegex = /\$([^:]+):[^;]*;?/;
  var variables = [];

  resolveImports(content, currentRequestPath).split(';').forEach(function (line) {
    var key = keyRegex.exec(line);
    if (!key) return;

    var name = key[1].trim();
    var value = getValue(line);

    if (!value) return;

    variables.push({ name: name, value: value });
  });

  return variables;
}