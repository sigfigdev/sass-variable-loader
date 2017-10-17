import path from 'path';
import fs from 'fs';
import stripComments from 'strip-json-comments';

const normalize = (content) => stripComments(content).replace(/!default|!important/g, '').trim();

const getImports = (content) => {
  const scssImports = [];
  const importMatcher = /@import\s+["']([^"']*)["'];/g;

  let matches;
  // eslint-disable-next-line no-cond-assign
  while (matches = importMatcher.exec(content)) {
    scssImports.push(matches[1]);
  }

  return scssImports;
};

const resolveImports = (content, currentRequestPath) => {
  const code = normalize(content);

  const fileImports = getImports(code).map(i => i.replace(/(\.scss)?$/, '.scss'));
  const importPaths = fileImports.map(i => {
    const fileToTry = path.resolve(path.dirname(currentRequestPath), i);
    if (fs.existsSync(fileToTry)) {
      return fileToTry;
    } else {
      // Add leading _ if file without doesn't exist
      const baseName = path.basename(i);
      const partialFileName = i.replace(new RegExp(`_?${baseName}`), `_${baseName}`);
      return path.resolve(path.dirname(currentRequestPath), partialFileName);
    }
  });

  if (importPaths) {
    const importContent = importPaths.map(
      importPath => resolveImports(fs.readFileSync(importPath).toString(), importPath)
    ).join('\n');
    return importContent + code;
  } else {
    return code;
  }
};

const getValue = (line) => {
  const variableRegex = /\$(.+):\s+(.+);?/;
  const mapRegex = /\$(.+):\s*\(([^)]*)\);?/;

  const map = mapRegex.exec(line);
  if (map) {
    return map[2].trim().split(',').reduce((prev, current) => {
      if (current) {
        return Object.assign({}, prev, { [current.match(/\w[^:]*/)[0]]: current.match(/:\s*([^;]*)/)[1] });
      }
      return prev;
    }, {});
  }
  const variable = variableRegex.exec(line);
  if (variable) {
    return variable[2].trim();
  }
  return "'";
};

export default function getVariables(content, currentRequestPath) {
  const keyRegex = /\$([^:]+):[^;]*;?/;
  const variables = [];

  resolveImports(content, currentRequestPath).split(';').forEach(line => {
    const key = keyRegex.exec(line);
    if (!key) return;

    const name = key[1].trim();
    const value = getValue(line);

    if (!value) return;

    variables.push({ name, value });
  });

  return variables;
}
