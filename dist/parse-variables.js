'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = parseVariables;

var _nodeSass = require('node-sass');

var _nodeSass2 = _interopRequireDefault(_nodeSass);

var _lodash = require('lodash.camelcase');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function constructSassString(variables) {
  var _Array$prototype;

  var asVariables = variables.map(function (_ref) {
    var name = _ref.name,
        value = _ref.value;

    if (typeof value === 'string') {
      return '$' + name + ': ' + value + ';';
    } else {
      return '$' + name + ': (' + JSON.stringify(value).replace(/['"{}]/g, '') + ');';
    }
  }).join('\n');
  var asClasses = (_Array$prototype = Array.prototype).concat.apply(_Array$prototype, _toConsumableArray(variables.map(function (_ref2) {
    var name = _ref2.name,
        value = _ref2.value;

    if (typeof value === 'string') {
      return '.' + name + ' { value: ' + value + ' }';
    } else {
      return Object.keys(value).map(function (key) {
        return '.' + name + '.' + key + ' { value: ' + value[key] + ' }';
      });
    }
  }))).join('\n');

  return asVariables + '\n' + asClasses;
}

function parseVariables(variables) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var result = _nodeSass2.default.renderSync({
    data: constructSassString(variables),
    outputStyle: 'compact'
  }).css.toString();

  return result.split(/\n/).filter(function (line) {
    return line && line.length;
  }).reduce(function (objectBuilder, variable) {
    var _$exec = /\.(.+) { value: (.+); }/.exec(variable),
        _$exec2 = _slicedToArray(_$exec, 3),
        name = _$exec2[1],
        value = _$exec2[2];

    var assignDeep = function assignDeep(obj, key, innerValue) {
      var _key$match = key.match(/^([^.]*)\.?(.*)/),
          _key$match2 = _slicedToArray(_key$match, 3),
          top = _key$match2[1],
          nested = _key$match2[2];

      var getKey = function getKey(k) {
        return opts.preserveVariableNames ? k : (0, _lodash2.default)(k);
      };
      if (nested) {
        return Object.assign({}, obj, _defineProperty({}, getKey(top), assignDeep(obj[getKey(top)] || {}, nested, innerValue)));
      } else {
        return Object.assign({}, obj, _defineProperty({}, getKey(top), innerValue));
      }
    };
    return assignDeep(objectBuilder, name, value);
  }, {});
}