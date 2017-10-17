import sass from 'node-sass';
import camelCase from 'lodash.camelcase';

function constructSassString(variables) {
  const asVariables = variables
    .map(({ name, value }) => {
      if (typeof value === 'string') {
        return `$${name}: ${value};`;
      } else {
        return `$${name}: (${JSON.stringify(value).replace(/['"{}]/g, '')});`;
      }
    }).join('\n');
  const asClasses = Array.prototype.concat(...variables
    .map(({ name, value }) => {
      if (typeof value === 'string') {
        return `.${name} { value: ${value} }`;
      } else {
        return Object.keys(value).map(key =>
          `.${name}.${key} { value: ${value[key]} }`
        );
      }
    }))
    .join('\n');

  return `${asVariables}\n${asClasses}`;
}

export default function parseVariables(variables, opts = {}) {
  const result = sass.renderSync({
    data: constructSassString(variables),
    outputStyle: 'compact',
  }).css.toString();

  return result.split(/\n/)
    .filter(line => line && line.length)
    .reduce((objectBuilder, variable) => {
      const [, name, value] = /\.(.+) { value: (.+); }/.exec(variable);

      const assignDeep = (obj, key, innerValue) => {
        const [, top, nested] = key.match(/^([^.]*)\.?(.*)/);
        const getKey = k => opts.preserveVariableNames ? k : camelCase(k);
        if (nested) {
          return Object.assign({}, obj, { [getKey(top)]: assignDeep(obj[getKey(top)] || {}, nested, innerValue) });
        } else {
          return Object.assign({}, obj, { [getKey(top)]: innerValue });
        }
      };
      return assignDeep(objectBuilder, name, value);
    }, {});
}
