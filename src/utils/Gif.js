const path = require('path');

// Define the base directory for your images
const mainImagePath = path.resolve(__dirname, 'src/data/images/main');
const bgImagePath = path.resolve(__dirname, 'src/data/images/main');

module.exports = {
    peachy: path.join(mainImagePath, 'peachy.gif'),
    yuu: path.join(bgImagePath, 'yuu.jpg'),

    thanks: path.join(mainImagePath, 'thanks.gif'),
    loadingSleep: path.join(mainImagePath, 'loadingSleep.gif'),
    loadingShower: path.join(mainImagePath, 'loadingShower.gif'),

    // Level
    angel: path.join(bgImagePath, 'angel.jpg'),
    lofi: path.join(bgImagePath, 'lofi.jpg'),
    luna: path.join(bgImagePath, 'luna.jpg'),
    moon: path.join(bgImagePath, 'moon.jpg'),
    naotomori: path.join(bgImagePath, 'naotomori.jpg'),
    ocean: path.join(bgImagePath, 'ocean.jpg'),
    sadboi: path.join(bgImagePath, 'sadboi.jpg'),
    sasuke: path.join(bgImagePath, 'sasuke.jpg'),
    saturoGojo: path.join(bgImagePath, 'saturoGojo.jpg'),
    sunrise: path.join(bgImagePath, 'sunrise.jpg'),
    scenery: path.join(bgImagePath, 'scenery.jpg'),
    sunriseRiver: path.join(bgImagePath, 'sunriseRiver.jpg'),

    noodle: path.join(bgImagePath, 'noodle.gif'),
    water: path.join(bgImagePath, 'water.gif'),
    waterWall: path.join(bgImagePath, 'waterWall.gif'),
    raining: path.join(bgImagePath, 'raining.gif'),
};
