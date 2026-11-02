/**
 * A smaller Phaser: only the modules Cinderfold uses (no physics, tilemaps, text, sound manager,
 * bitmap text, curves, meshes...). Built from Phaser's own sources (MIT); vite.config.ts aliases
 * `phaser` to this file for the browser build and sets Phaser's compile-time flags. Types still
 * come from the full `phaser` package.
 */
require('phaser/src/polyfills/requestVideoFrame');

const CONST = require('phaser/src/const');
const Extend = require('phaser/src/utils/object/Extend');

let Phaser = {
  Animations: require('phaser/src/animations'),
  BlendModes: require('phaser/src/renderer/BlendModes'),
  Cache: require('phaser/src/cache'),
  Cameras: { Scene2D: require('phaser/src/cameras/2d') },
  Core: require('phaser/src/core'),
  Class: require('phaser/src/utils/Class'),
  Data: require('phaser/src/data'),
  Display: { Masks: require('phaser/src/display/mask') },
  DOM: require('phaser/src/dom'),
  Events: require('phaser/src/events'),
  FX: require('phaser/src/fx'),
  Game: require('phaser/src/core/Game'),
  GameObjects: {
    DisplayList: require('phaser/src/gameobjects/DisplayList'),
    GameObjectCreator: require('phaser/src/gameobjects/GameObjectCreator'),
    GameObjectFactory: require('phaser/src/gameobjects/GameObjectFactory'),
    UpdateList: require('phaser/src/gameobjects/UpdateList'),
    Components: require('phaser/src/gameobjects/components'),
    BuildGameObject: require('phaser/src/gameobjects/BuildGameObject'),
    BuildGameObjectAnimation: require('phaser/src/gameobjects/BuildGameObjectAnimation'),
    GameObject: require('phaser/src/gameobjects/GameObject'),
    Events: require('phaser/src/gameobjects/events'),
    Graphics: require('phaser/src/gameobjects/graphics/Graphics'),
    Image: require('phaser/src/gameobjects/image/Image'),
    Sprite: require('phaser/src/gameobjects/sprite/Sprite'),
    Particles: require('phaser/src/gameobjects/particles'),
    Factories: {
      Graphics: require('phaser/src/gameobjects/graphics/GraphicsFactory'),
      Image: require('phaser/src/gameobjects/image/ImageFactory'),
      Sprite: require('phaser/src/gameobjects/sprite/SpriteFactory'),
      ParticleEmitter: require('phaser/src/gameobjects/particles/ParticleEmitterFactory'),
    },
    Creators: {
      Graphics: require('phaser/src/gameobjects/graphics/GraphicsCreator'),
      Image: require('phaser/src/gameobjects/image/ImageCreator'),
      Sprite: require('phaser/src/gameobjects/sprite/SpriteCreator'),
      ParticleEmitter: require('phaser/src/gameobjects/particles/ParticleEmitterCreator'),
    },
  },
  Geom: { Rectangle: require('phaser/src/geom/rectangle') },
  Input: require('phaser/src/input'),
  Loader: {
    FileTypes: {
      AtlasJSONFile: require('phaser/src/loader/filetypes/AtlasJSONFile'),
      ImageFile: require('phaser/src/loader/filetypes/ImageFile'),
      JSONFile: require('phaser/src/loader/filetypes/JSONFile'),
    },
    Events: require('phaser/src/loader/events'),
    File: require('phaser/src/loader/File'),
    FileTypesManager: require('phaser/src/loader/FileTypesManager'),
    GetURL: require('phaser/src/loader/GetURL'),
    LoaderPlugin: require('phaser/src/loader/LoaderPlugin'),
    MergeXHRSettings: require('phaser/src/loader/MergeXHRSettings'),
    MultiFile: require('phaser/src/loader/MultiFile'),
    XHRLoader: require('phaser/src/loader/XHRLoader'),
    XHRSettings: require('phaser/src/loader/XHRSettings'),
  },
  Math: {
    Between: require('phaser/src/math/Between'),
    Clamp: require('phaser/src/math/Clamp'),
    DegToRad: require('phaser/src/math/DegToRad'),
    FloatBetween: require('phaser/src/math/FloatBetween'),
    RadToDeg: require('phaser/src/math/RadToDeg'),
    Vector2: require('phaser/src/math/Vector2'),
  },
  Plugins: require('phaser/src/plugins'),
  Renderer: require('phaser/src/renderer'),
  Scale: require('phaser/src/scale'),
  ScaleModes: require('phaser/src/renderer/ScaleModes'),
  Scene: require('phaser/src/scene/Scene'),
  Scenes: require('phaser/src/scene'),
  Structs: require('phaser/src/structs'),
  Textures: require('phaser/src/textures'),
  Time: require('phaser/src/time'),
  Tweens: require('phaser/src/tweens'),
};

Phaser = Extend(false, Phaser, CONST);

module.exports = Phaser;
module.exports.default = Phaser;
