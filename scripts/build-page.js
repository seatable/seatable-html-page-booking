import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import process from 'process';
import dayjs from 'dayjs';


const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const buildPath = resolveApp('dist');
const pageConfigPath = resolveApp('page-config');
const pageZipPath = resolveApp('page-zip');

const zip = new JSZip();

// build file
const jsDirpath = buildPath + '/js';
const cssDirpath = buildPath + '/css';
const jsFilePath = getFullFileName(jsDirpath);
const cssFilePath = getFullFileName(cssDirpath);
const imagesPath = path.join(buildPath, '/media/images');

zip.folder('task');
zip.folder('task/media');

// write images
const imagesPaths = fs.readdirSync(imagesPath);
imagesPaths.forEach((filePath) => {
  zip.folder('task/media/images/').file(filePath, fs.readFileSync(imagesPath + '/' + filePath));
});

// write js and css
if (isDirExist(jsDirpath) && jsFilePath) {
  zip.file('task/main.js', getFileContent(jsFilePath));
}

if (isDirExist(cssDirpath) && cssFilePath) {
  zip.file('task/main.css', getFileContent(cssFilePath));
}

// write icon
if (isFileExist(pageConfigPath, 'icon.png')) {
  const iconPath = path.join(pageConfigPath, 'icon.png');
  zip.file('task/media/icon.png', fs.readFileSync(iconPath));
}

// info file
const pageInfoFilePath = path.join(pageConfigPath, 'info.json');
const pageInfoContent = JSON.parse(getFileContent(pageInfoFilePath));

const pageInfoContentExpand = {
  'last_modified': dayjs().format(),
  'has_css': !!cssFilePath,
  'has_icon': isFileExist(pageConfigPath, 'icon.png'),
};

let jsonFileContent = Object.assign({}, pageInfoContent, pageInfoContentExpand);

zip.file('task/info.json', JSON.stringify(jsonFileContent, null, '  '));

zip.generateAsync({ type: 'nodebuffer' }).then(function (content) {
  let zip = `${pageInfoContent.name}-${pageInfoContent.version}.zip`;
  fs.writeFile(pageZipPath + '/' + zip, content, function (err) {
    if (err) {
      console.log(zip + ' failed');
      console.log(err);
      return;
    }
    console.log(zip + ' successful');
  });
});

function isDirExist(path) {
  return fs.existsSync(path);
}

function isFileExist(overallPath, fileName) {
  return fs.readdirSync(overallPath).includes(fileName);
}

/**
 * Get the full file path
 * @param  {string} overallPath File parent path
 */
function getFullFileName(overallPath) {
  if (!isDirExist(overallPath)) {
    return false;
  }
  const moduleFileExtensions = ['js', 'css'];
  const fileName = fs.readdirSync(overallPath).find(fileItem => {
    let extension = fileItem.substring(fileItem.lastIndexOf('.') + 1);
    if (moduleFileExtensions.includes(extension)) {
      return fileItem;
    }
  });
  if (!fileName) {
    return false;
  }
  return path.join(overallPath, fileName);
}

/**
 * Get file content
 * @param  {string} overallPath full file path
 */
function getFileContent(overallPath) {
  // Specifying encoding returns a string, otherwise returns a Buffer
  let content = fs.readFileSync(overallPath, { encoding: 'utf-8' });
  return content;
}
