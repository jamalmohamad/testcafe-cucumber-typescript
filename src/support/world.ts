import * as base64Img from 'base64-img';
import testControllerHolder from './test-controller-holder';
import { setDefaultTimeout, setWorldConstructor } from 'cucumber';

const DEFAULT_TIMEOUT = 30 * 1000;

function CustomWorld({ attach }) {
  this.worldName = 'Cucumber World';
  /**
   * this function is crucial for the Given-Part of each feature as it provides the TestController
   */
  this.waitForTestController = testControllerHolder.get;

  /**
   * Configure TestController
   */
  testControllerHolder
    .get()
    .then((tc: TestController) => tc.maximizeWindow())
    .catch((error) => console.warn('TestController could not be captured', error));

  /**
   * function that attaches the attachment (e.g. screenshot) to the report
   */
  this.attach = attach;

  /**
   * Report generation only permitted if one of the following options is set
   */
  this.canGenerateReport = (): boolean => {
    return (
      process.argv.includes('--format') ||
      process.argv.includes('-f') ||
      process.argv.includes('--format-options')
    );
  };

  /**
   * Adds embeddings to the "After"-step (see report.json):
   * "embeddings": [
   *   {
   *     "data": "base64 encoded image"
   *     "mime_type": "image/png"
   *   }
   * ]
   *
   * Usage (function scope!):
   * <pre>
   * Then(/^I capture the screen$/, async function() {
   *   await this.addScreenshotToReport();
   * }
   * </pre>
   */
  this.addScreenshotToReport = async function() {
    if (this.canGenerateReport()) {
      const tc = await this.waitForTestController();
      tc
        .takeScreenshot()
        .then((path) => this.attachScreenshotToReport(path))
        .catch((error) => console.warn('The screenshot was not attached to the report', error));
    } else {
      return new Promise((resolve) => resolve(null));
    }
  };

  /**
   * Adds the screenshot under the given path to the json report
   * @param pathToScreenshot The path under which the screenshot has been saved
   */
  this.attachScreenshotToReport = (pathToScreenshot: string) => {
    const imgInBase64 = base64Img.base64Sync(pathToScreenshot);
    const imageConvertForCuc = imgInBase64.substring(imgInBase64.indexOf(',') + 1);
    return attach(imageConvertForCuc, 'image/png');
  };
}

setDefaultTimeout(DEFAULT_TIMEOUT);

setWorldConstructor(CustomWorld);