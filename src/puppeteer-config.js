const chromium = require("chrome-aws-lambda");

const getOptions = async () => {
  const options = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  };
  return options;
};

module.exports = getOptions;
