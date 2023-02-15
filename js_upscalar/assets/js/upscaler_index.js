(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.DefaultUpscalerJSModel = factory());
})(this, (function () { 'use strict';

    const NAME = "@upscalerjs/default-model";
    const VERSION = "1.0.0-beta.12";

    const SCALE = 2;
    const clipOutput = (tf) => (output) => tf.tidy(() => {
        const clippedValue = output.clipByValue(0, 255);
        output.dispose();
        return clippedValue;
    });
    const modelDefinition = tf => ({
        scale: SCALE,
        channels: 3,
        path: `models/model.json`,
        packageInformation: {
            name: NAME,
            version: VERSION,
        },
        meta: {
            C: 1,
            D: 2,
            G: 4,
            G0: 64,
            T: 10,
            architecture: "rdn",
            patchSize: 128,
            size: 'slim',
            artifactReducing: false,
            sharpening: false,
            dataset: 'div2k',
            modelFileName: 'rdn-C1-D2-G4-G064-T10-x2-patchsize128-compress100-sharpen0-datadiv2k-vary_cFalse_best-val_loss_epoch494',
        },
        postprocess: clipOutput(tf),
    });

    return modelDefinition;

}));
