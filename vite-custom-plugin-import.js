export default function viteCustomPluginImport(options = {}) {
  const {
    libraryName,
    libraryDirectory = 'lib',
    camel2DashComponentName = false,
    camel2UnderlineComponentName = false,
    style = false,
    styleLibraryDirectory = 'lib',
  } = options;

  if (!libraryName) {
    throw new Error('vite-custom-plugin-import: libraryName is required');
  }
  const escapedLibraryName = libraryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    name: 'vite-custom-plugin-import',
    enforce: 'pre',
    transform(code, id) {
      // support file types
      if (!/\.(jsx?|tsx?|vue)$/.test(id)) {
        return null;
      }

      // excludes node_modules
      if (id.includes('node_modules') && !id.includes(libraryName)) {
        return null;
      }

      //  check lib
      if (!code.includes(libraryName)) {
        return null;
      }

      let transformedCode = code;
      let hasTransformed = false;

      // match imports: import { Button } from 'library-name'
      const importRegex = new RegExp(
        `import\\s+{([^}]+)}\\s+from\\s+['"]${escapedLibraryName}['"]`,
        'g'
      );

      transformedCode = transformedCode.replace(importRegex, (match, imports) => {
        hasTransformed = true;

        // parse components
        const components = imports
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
          .map(item => {
            // handle rename: { Button as Btn }
            const asMatch = item.match(/^(\w+)\s+as\s+(\w+)$/);
            if (asMatch) {
              return {
                imported: asMatch[1].trim(),
                local: asMatch[2].trim(),
              };
            }
            return {
              imported: item.trim(),
              local: item.trim(),
            };
          });

        // generate new imports
        const newImports = components.map(({ imported, local }) => {
          // trans component name
          const componentPath = transformComponentName(
            imported,
            camel2DashComponentName,
            camel2UnderlineComponentName
          );

          // generate component import path
          const componentImportPath = `${libraryName}/${libraryDirectory}/${componentPath}`;
          let importStatement = '';
          if (local === imported) {
            importStatement = `import ${local} from '${componentImportPath}';`;
          } else {
            importStatement = `import ${imported} as ${local} from '${componentImportPath}';`;
          }

          // import style if required
          if (style) {
            const stylePath = getStylePath(
              libraryName,
              styleLibraryDirectory,
              componentPath,
              style
            );
            if (stylePath) {
              importStatement += `\nimport '${stylePath}';`;
            }
          }
          return importStatement;
        });
        return newImports.join('\n');
      });

      if (!hasTransformed) {
        return null;
      }

      return {
        code: transformedCode,
        map: null,
      };
    },
  };
}

// trans component name
function transformComponentName(name, camel2Dash, camel2Underline) {
  if (camel2Dash) {
    // MyButton -> my-button
    return name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }
  if (camel2Underline) {
    // MyButton -> my_button
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
  return name;
}

// get style file path
function getStylePath(libraryName, styleLibraryDirectory, componentPath, style) {
  if (!style) {
    return null;
  }

  if (typeof style === 'string') {
    return style.replace('[name]', componentPath);
  }

  if (typeof styleLibraryDirectory === 'function') {
    return styleLibraryDirectory(componentPath);
  }

  if (style === true || style === 'css') {
    return `${libraryName}/${styleLibraryDirectory}/${componentPath}/style/css`;
  }

  if (style === 'less') {
    return `${libraryName}/${styleLibraryDirectory}/${componentPath}/style`;
  }

  return null;
}
