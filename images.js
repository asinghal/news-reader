const { Jimp } = require('jimp');

async function getBrightness(imageUrl) {
  try {
    const image = await Jimp.read(imageUrl);
    let colorSum = 0;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      const luminance = (red * 0.299 + green * 0.587 + blue * 0.114);
      colorSum += luminance;
    });

    const brightness = Math.floor(colorSum / (image.bitmap.width * image.bitmap.height));
    return brightness < 128 ? 'dark' : 'light';

  } catch (err) {
    console.error(err);
    throw new Error('Failed to process image');
  }
}

module.exports = { getBrightness };