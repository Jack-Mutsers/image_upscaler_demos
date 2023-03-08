(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@tensorflow/tfjs'), require('@upscalerjs/default-model'), require('@tensorflow/tfjs-core')) :
    typeof define === 'function' && define.amd ? define(['@tensorflow/tfjs', '@upscalerjs/default-model', '@tensorflow/tfjs-core'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Upscaler = factory(global.tf, global.DefaultUpscalerJSModel, global.tf));
})(this, (function (tf$1, DefaultUpscalerModel, tf) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var tf__namespace$1 = /*#__PURE__*/_interopNamespace(tf$1);
    var DefaultUpscalerModel__default = /*#__PURE__*/_interopDefaultLegacy(DefaultUpscalerModel);
    var tf__namespace = /*#__PURE__*/_interopNamespace(tf);

    const isShape4D = (shape) => {
        if (!Boolean(shape) || !Array.isArray(shape) || shape.length !== 4) {
            return false;
        }
        for (const val of shape) {
            if (val !== null && typeof val !== 'number') {
                return false;
            }
        }
        return true;
    };
    function makeIsNDimensionalTensor(rank) {
        function fn(pixels) {
            try {
                return pixels.shape.length === rank;
            }
            catch (err) { }
            return false;
        }
        return fn;
    }
    const isFourDimensionalTensor = makeIsNDimensionalTensor(4);
    const isThreeDimensionalTensor = makeIsNDimensionalTensor(3);
    const isTensor = (input) => input instanceof tf__namespace.Tensor;
    const isString = (el) => typeof el === 'string';
    const isValidModelType = (modelType) => typeof modelType === 'string' && ['layers', 'graph',].includes(modelType);
    var MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE;
    (function (MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE) {
        MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE["UNDEFINED"] = "undefined";
        MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE["INVALID_MODEL_TYPE"] = "invalidModelType";
        MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE["MISSING_PATH"] = "missingPath";
    })(MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE || (MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE = {}));
    class ModelDefinitionValidationError extends Error {
        type;
        constructor(type) {
            super(type);
            this.type = type;
        }
    }
    const isValidModelDefinition = (modelDefinition) => {
        if (modelDefinition === undefined) {
            throw new ModelDefinitionValidationError(MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE.UNDEFINED);
        }
        if (!isValidModelType(modelDefinition.modelType || 'layers')) {
            throw new ModelDefinitionValidationError(MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE.INVALID_MODEL_TYPE);
        }
        if (!modelDefinition.path) {
            throw new ModelDefinitionValidationError(MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE.MISSING_PATH);
        }
        return true;
    };
    const isNumber = (el) => typeof el === 'number';
    const isValidRange = (range) => Array.isArray(range) && range.length === 2 && range.every(isNumber);

    const isLayersModel = (model) => model instanceof tf__namespace$1.LayersModel;

    class AbortError extends Error {
        message = 'The upscale request received an abort signal';
    }
    const ERROR_MISSING_MODEL_DEFINITION_PATH_URL = 'https://upscalerjs.com/documentation/troubleshooting#missing-model-path';
    const ERROR_INVALID_MODEL_TYPE_URL = 'https://upscalerjs.com/documentation/troubleshooting#invalid-model-type';
    const WARNING_INPUT_SIZE_AND_PATCH_SIZE_URL = 'https://upscalerjs.com/documentation/troubleshooting#input-size-and-patch-size';
    const ERROR_WITH_MODEL_INPUT_SHAPE_URL = 'https://upscalerjs.com/documentation/troubleshooting#error-with-model-input-shape';
    const ERROR_MISSING_MODEL_DEFINITION_PATH = [
        'You must provide a "path" when providing a model definition',
        `For more information, see ${ERROR_MISSING_MODEL_DEFINITION_PATH_URL}.`,
    ].join('\n');
    const ERROR_INVALID_MODEL_TYPE = (modelType) => ([
        `You've provided an invalid model type: ${JSON.stringify(modelType)}. Accepted types are "layers" and "graph".`,
        `For more information, see ${ERROR_INVALID_MODEL_TYPE_URL}.`,
    ].join('\n'));
    const ERROR_MODEL_DEFINITION_BUG = 'There is a bug with the upscaler code. Please report this.';
    const WARNING_INPUT_SIZE_AND_PATCH_SIZE = [
        'You have provided a patchSize, but the model definition already includes an input size.',
        'Your patchSize will be ignored.',
        `For more information, see ${WARNING_INPUT_SIZE_AND_PATCH_SIZE_URL}.`,
    ].join('\n');
    const ERROR_WITH_MODEL_INPUT_SHAPE = (inputShape) => [
        `Expected model to have a rank-4 compatible input shape. Instead got: ${JSON.stringify(inputShape)}.`,
        `For more information, see ${ERROR_WITH_MODEL_INPUT_SHAPE_URL}.`,
    ].join('\n');
    function getModelDefinitionError(error, modelDefinition) {
        switch (error) {
            case MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE.MISSING_PATH:
                return new Error(ERROR_MISSING_MODEL_DEFINITION_PATH);
            case MODEL_DEFINITION_VALIDATION_CHECK_ERROR_TYPE.INVALID_MODEL_TYPE:
                return new Error(ERROR_INVALID_MODEL_TYPE(modelDefinition?.modelType));
            default:
                return new Error(ERROR_MODEL_DEFINITION_BUG);
        }
    }
    const warn = (msg) => {
        console.warn(Array.isArray(msg) ? msg.join('\n') : msg);
    };
    function isProgress(p) { return p !== undefined && typeof p === 'function'; }
    function isSingleArgProgress(p) { return isProgress(p) && p.length <= 1; }
    const isMultiArgTensorProgress = (p, output, progressOutput) => {
        if (!isProgress(p) || p.length <= 1) {
            return false;
        }
        return progressOutput === undefined && output === 'tensor' || progressOutput === 'tensor';
    };
    const isAborted = (abortSignal) => {
        if (abortSignal) {
            return abortSignal.aborted;
        }
        return false;
    };
    async function wrapGenerator(gen, postNext) {
        let result;
        for (result = await gen.next(); !result.done; result = await gen.next()) {
            if (postNext) {
                await postNext(result.value);
            }
        }
        return result.value;
    }
    function isModelDefinitionFn(modelDefinition) { return typeof modelDefinition === 'function'; }
    const tensorAsClampedArray = (tensor) => tf__namespace$1.tidy(() => {
        const [height, width,] = tensor.shape;
        const fill = tf__namespace$1.fill([height, width,], 255).expandDims(2);
        return tensor.clipByValue(0, 255).concat([fill,], 2).dataSync();
    });
    function getModel(modelDefinition) {
        return isModelDefinitionFn(modelDefinition) ? modelDefinition(tf__namespace$1) : modelDefinition;
    }
    function nonNullable(value) {
        return value !== null && value !== undefined;
    }
    function processAndDisposeOfTensor(tensor, ..._processFns) {
        const processFns = _processFns.filter(nonNullable);
        if (processFns.length) {
            const processedTensor = tf__namespace$1.tidy(() => processFns.reduce((reducedTensor, processFn) => processFn(reducedTensor), tensor));
            if (!tensor.isDisposed && tensor !== processedTensor) {
                tensor.dispose();
            }
            return processedTensor;
        }
        return tensor;
    }
    async function loadTfModel(modelPath, modelType = 'layers') {
        if (modelType === 'graph') {
            return await tf__namespace$1.loadGraphModel(modelPath);
        }
        return await tf__namespace$1.loadLayersModel(modelPath);
    }
    const getBatchInputShape = (model) => {
        if (isLayersModel(model)) {
            return model.layers[0].batchInputShape;
        }
        return model.inputs[0].shape;
    };
    const getInputShape = (model) => {
        const batchInputShape = getBatchInputShape(model);
        if (isShape4D(batchInputShape)) {
            return batchInputShape;
        }
        throw new Error(ERROR_WITH_MODEL_INPUT_SHAPE(batchInputShape));
    };
    const scaleIncomingPixels = (range) => (tensor) => {
        if (isValidRange(range) && range[1] === 1) {
            return tf__namespace$1.mul(tensor, 1 / 255);
        }
        return tensor;
    };
    const isInputSizeDefined = (inputShape) => Boolean(inputShape) && isShape4D(inputShape) && Boolean(inputShape[1]) && Boolean(inputShape[2]);
    const parsePatchAndInputSizes = (model, { patchSize, padding, }) => {
        const inputShape = getInputShape(model);
        if (isInputSizeDefined(inputShape) && patchSize !== undefined) {
            warn(WARNING_INPUT_SIZE_AND_PATCH_SIZE);
        }
        if (isInputSizeDefined(inputShape)) {
            if (inputShape[1] !== inputShape[2]) {
                throw new Error('Input shape must be square');
            }
            return {
                patchSize: inputShape[1] - (padding || 0) * 2,
                padding,
            };
        }
        return {
            patchSize,
            padding,
        };
    };
    const padInput = (inputShape) => (pixels) => {
        const pixelsHeight = pixels.shape[1];
        const pixelsWidth = pixels.shape[2];
        if (isInputSizeDefined(inputShape) && (inputShape[1] > pixelsHeight || inputShape[2] > pixelsWidth)) {
            return tf__namespace$1.tidy(() => {
                const height = Math.max(pixelsHeight, inputShape[1]);
                const width = Math.max(pixelsWidth, inputShape[2]);
                const rightTensor = tf__namespace$1.zeros([1, pixelsHeight, width - pixelsWidth, 3,]);
                const bottomTensor = tf__namespace$1.zeros([1, height - pixelsHeight, width, 3,]);
                const topTensor = tf__namespace$1.concat([pixels, rightTensor,], 2);
                const final = tf__namespace$1.concat([topTensor, bottomTensor,], 1);
                return final;
            });
        }
        return pixels;
    };
    const trimInput = (imageSize, scale) => (pixels) => {
        const height = imageSize[1] * scale;
        const width = imageSize[2] * scale;
        if (height < pixels.shape[1] || width < pixels.shape[2]) {
            return tf__namespace$1.tidy(() => tf__namespace$1.slice(pixels, [0, 0, 0,], [1, height, width, 3,]));
        }
        return pixels;
    };
    const scaleOutput = (range) => (pixels) => {
        const endingRange = isValidRange(range) ? range[1] : 255;
        return pixels.clipByValue(0, endingRange).mul(endingRange === 1 ? 255 : 1);
    };

    const getOutputOption = (output) => {
        if (output === 'tensor') {
            return 'tensor';
        }
        return 'base64';
    };
    function getUpscaleOptions(model, { output, progressOutput, ...options } = {}) {
        return {
            ...options,
            ...parsePatchAndInputSizes(model, options),
            output: getOutputOption(output),
            progressOutput: getOutputOption(progressOutput || output),
        };
    }

    const CDN_PATH_DEFINITIONS = {
        'jsdelivr': (packageName, version, path) => `https://cdn.jsdelivr.net/npm/${packageName}@${version}/${path}`,
        'unpkg': (packageName, version, path) => `https://unpkg.com/${packageName}@${version}/${path}`,
    };
    const CDNS = [
        'jsdelivr',
        'unpkg',
    ];
    const getLoadModelErrorMessage = (modelPath, packageInformation, errs) => new Error([
        `Could not resolve URL ${modelPath} for package ${packageInformation.name}@${packageInformation.version}`,
        `Errors include:`,
        ...errs.map(([cdn, err,]) => `- ${cdn}: ${err.message}`),
    ].join('\n'));
    const fetchModel = async ({ path: modelPath, modelType, packageInformation, }) => {
        if (packageInformation) {
            const errs = [];
            for (let i = 0; i < CDNS.length; i++) {
                const cdn = CDNS[i];
                const getCDNFn = CDN_PATH_DEFINITIONS[cdn];
                try {
                    const url = getCDNFn(packageInformation.name, packageInformation.version, modelPath);
                    return await loadTfModel(url, modelType);
                }
                catch (err) {
                    errs.push([cdn, err instanceof Error ? err : new Error(`There was an unknown error: ${JSON.stringify(err)}`),]);
                }
            }
            throw getLoadModelErrorMessage(modelPath, packageInformation, errs);
        }
        return await loadTfModel(modelPath, modelType);
    };
    const loadModel = async (modelDefinition) => {
        try {
            isValidModelDefinition(modelDefinition);
        }
        catch (err) {
            throw err instanceof ModelDefinitionValidationError ? getModelDefinitionError(err.type, modelDefinition) : new Error(ERROR_MODEL_DEFINITION_BUG);
        }
        const model = await fetchModel(modelDefinition);
        return {
            model,
            modelDefinition,
        };
    };

    const makeTick = (signal, awaitNextFrame) => async (result) => {
        if (awaitNextFrame) {
            await tf__namespace$1.nextFrame();
        }
        if (isAborted(signal)) {
            if (Array.isArray(result)) {
                result.forEach(r => r?.dispose());
            }
            else if (isTensor(result)) {
                result.dispose();
            }
            throw new AbortError();
        }
    };

    const isWarmupSizeByPatchSize = (size) => {
        if (!size || typeof size !== 'object') {
            return false;
        }
        return 'patchSize' in size && typeof size['patchSize'] === 'number';
    };
    const isNumericWarmupSize = (size) => {
        return Boolean(size) && Array.isArray(size) && size.length === 2 && typeof size[0] === 'number' && typeof size[1] === 'number';
    };
    const ERROR_INVALID_WARMUP_VALUE_URL = 'https://upscalerjs.com/documentation/troubleshooting#invalid-warmup-value';
    const ERROR_INVALID_WARMUP_VALUE = (size) => ([
        'Invalid value passed to warmup in warmupSizes:',
        JSON.stringify(size),
        `For more information, see ${ERROR_INVALID_WARMUP_VALUE_URL}.`,
    ].join('\n'));
    const getInvalidValueError = (size) => new Error(ERROR_INVALID_WARMUP_VALUE(size));
    const getWidthAndHeight$1 = (size) => {
        if (isWarmupSizeByPatchSize(size)) {
            const { patchSize, padding = 0, } = size;
            const amount = patchSize + padding * 2;
            return [amount, amount,];
        }
        return size;
    };
    async function* warmup(modelPackage, sizes) {
        const { model, modelDefinition, } = await modelPackage;
        for (const size of sizes) {
            if (!isWarmupSizeByPatchSize(size) && !isNumericWarmupSize(size)) {
                throw getInvalidValueError(size);
            }
            const [width, height,] = getWidthAndHeight$1(size);
            let dummyTensor = tf__namespace$1.zeros([1, height, width, 3,]);
            yield [dummyTensor,];
            const fns = [
                modelDefinition.preprocess,
                (t) => model.predict(t),
                modelDefinition.postprocess,
            ].filter(Boolean);
            for (let i = 0; i < fns.length; i++) {
                const fn = fns[i];
                dummyTensor = processAndDisposeOfTensor(dummyTensor, fn);
                yield [dummyTensor,];
            }
            dummyTensor.dispose();
            yield;
        }
    }
    const getSizesAsArray = (sizes) => {
        if (Array.isArray(sizes)) {
            if (isNumericWarmupSize(sizes)) {
                return [sizes,];
            }
            for (const size of sizes) {
                if (!isWarmupSizeByPatchSize(size) && !isNumericWarmupSize(size)) {
                    throw getInvalidValueError(size);
                }
            }
            return sizes;
        }
        else if (isWarmupSizeByPatchSize(sizes)) {
            return [sizes,];
        }
        throw getInvalidValueError(sizes);
    };
    const cancellableWarmup = async (modelPackage, sizes, { signal = undefined, awaitNextFrame = false, } = {}, internalArgs) => {
        const tick = makeTick(signal || internalArgs.signal, awaitNextFrame);
        await tick();
        await wrapGenerator(warmup(modelPackage, getSizesAsArray(sizes)), tick);
    };

    const ERROR_ENVIRONMENT_DISALLOWS_BASE64_URL = 'https://upscalerjs.com/documentation/troubleshooting#environment-disallows-base64';
    const ERROR_ENVIRONMENT_DISALLOWS_STRING_INPUT_URL = 'https://upscalerjs.com/documentation/troubleshooting#environment-disallows-string-input';
    const getEnvironmentDisallowsStringInput = () => new Error([
        'Environment does not support a string URL as an input format.',
        `For more information, see ${ERROR_ENVIRONMENT_DISALLOWS_STRING_INPUT_URL}.`,
    ].join('\n'));
    const getEnvironmentDisallowsBase64 = () => new Error([
        'Environment does not support base64 as an output format.',
        `For more information, see ${ERROR_ENVIRONMENT_DISALLOWS_BASE64_URL}.`,
    ].join('\n'));
    const getInvalidTensorError = (input) => new Error([
        `Unsupported dimensions for incoming pixels: ${input.shape.length}.`,
        'Only 3 or 4 rank tensors are supported.',
    ].join('\n'));
    const getInvalidImageError = () => new Error([
        'Failed to load image',
    ].join(' '));
    const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(getInvalidImageError());
    });
    const fromPixels = (input) => tf__namespace$1.browser.fromPixelsAsync(input);
    const getTensorFromInput = async (input) => {
        if (isTensor(input)) {
            return input;
        }
        if (isString(input)) {
            const imgHTMLElement = await loadImage(input);
            return fromPixels(imgHTMLElement);
        }
        return fromPixels(input);
    };
    const getImageAsTensor = async (input) => {
        const tensor = await getTensorFromInput(input);
        if (isThreeDimensionalTensor(tensor)) {
            const expandedTensor = tensor.expandDims(0);
            tensor.dispose();
            return expandedTensor;
        }
        if (isFourDimensionalTensor(tensor)) {
            return tensor;
        }
        throw getInvalidTensorError(tensor);
    };
    const tensorAsBase64 = (tensor) => {
        const arr = tensorAsClampedArray(tensor);
        const [height, width,] = tensor.shape;
        const imageData = new ImageData(width, height);
        imageData.data.set(arr);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No context found');
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    };
    const checkIfValidEnvironment = (errFn) => {
        try {
            (new Image() && 'createElement' in document) === true;
        }
        catch (err) {
            const error = errFn();
            console.log(error);
            throw error;
        }
    };
    const checkValidEnvironment = (input, { output = 'base64', progressOutput, }) => {
        if (typeof input === 'string') {
            checkIfValidEnvironment(getEnvironmentDisallowsStringInput);
        }
        if (progressOutput === 'base64' || output === 'base64') {
            checkIfValidEnvironment(getEnvironmentDisallowsBase64);
        }
    };

    const WARNING_UNDEFINED_PADDING_URL = 'https://upscalerjs.com/documentation/troubleshooting#padding-is-undefined';
    const WARNING_UNDEFINED_PADDING = [
        '"padding" is undefined, but "patchSize" is explicitly defined.',
        'Without padding, patches of images often have visible artifacting at the seams. Defining an explicit padding will resolve the artifacting.',
        `For more information, see ${WARNING_UNDEFINED_PADDING_URL}.`,
        'To hide this warning, pass an explicit padding of "0".',
    ].join('\n');
    const WARNING_PROGRESS_WITHOUT_PATCH_SIZE_URL = 'https://upscalerjs.com/documentation/troubleshooting#progress-specified-without-patch-size';
    const WARNING_PROGRESS_WITHOUT_PATCH_SIZE = [
        'The "progress" callback was provided but "patchSize" was not defined.',
        'Without a "patchSize", the "progress" callback will never be called.',
        `For more information, see ${WARNING_PROGRESS_WITHOUT_PATCH_SIZE_URL}.`,
    ].join('\n');
    const ERROR_INVALID_TENSOR_PREDICTED_URL = 'https://upscalerjs.com/documentation/troubleshooting#invalid-predicted-tensor';
    const ERROR_INVALID_TENSOR_PREDICTED = (tensor) => [
        `The tensor returned by the model was not a valid rank-4 tensor. It's shape is ${JSON.stringify(tensor.shape)}.}`,
        'UpscalerJS only supports models returning valid image-like data in four dimensional form.',
        `For more information, see ${ERROR_INVALID_TENSOR_PREDICTED_URL}.`,
    ].join('\n');
    const ERROR_INVALID_MODEL_PREDICTION_URL = 'https://upscalerjs.com/documentation/troubleshooting#invalid-model-prediction';
    const ERROR_INVALID_MODEL_PREDICTION = [
        'The model output was not a valid tensor. UpscalerJS only supports models returning valid tensors.',
        'This is likely an error with the model itself, not UpscalerJS.',
        `For more information, see ${ERROR_INVALID_MODEL_PREDICTION_URL}.`,
    ].join('\n');
    const GET_INVALID_SHAPED_TENSOR = (tensor) => new Error(`Invalid shape provided to getWidthAndHeight, expected tensor of rank 3 or 4: ${JSON.stringify(tensor.shape)}`);
    const GET_UNDEFINED_TENSORS_ERROR = () => new Error('No defined tensors were passed to concatTensors');
    const getWidthAndHeight = (tensor) => {
        if (isFourDimensionalTensor(tensor)) {
            return [tensor.shape[1], tensor.shape[2],];
        }
        if (isThreeDimensionalTensor(tensor)) {
            return [tensor.shape[0], tensor.shape[1],];
        }
        throw GET_INVALID_SHAPED_TENSOR(tensor);
    };
    const getRowsAndColumns = (pixels, patchSize) => {
        const [height, width,] = getWidthAndHeight(pixels);
        return {
            rows: Math.ceil(height / patchSize),
            columns: Math.ceil(width / patchSize),
        };
    };
    const checkAndAdjustStartingPosition = (dimension, origin, sliceOrigin) => {
        if (origin[dimension] < 0) {
            const amount = 0 - origin[dimension];
            origin[dimension] += amount;
            sliceOrigin[dimension] -= amount;
        }
    };
    const checkAndAdjustEndingPosition = (size, dimension, endPosition, origin, sliceOrigin, sliceEndPosition) => {
        if (endPosition[dimension] > size) {
            const amount = endPosition[dimension] - size;
            let compensatingAmount = 0;
            if (origin[dimension] - amount < 0) {
                compensatingAmount = 0 - (origin[dimension] - amount);
            }
            origin[dimension] -= amount - compensatingAmount;
            endPosition[dimension] -= amount;
            const sliceAmount = amount - compensatingAmount;
            sliceOrigin[dimension] += sliceAmount;
            sliceEndPosition[dimension] += sliceAmount;
        }
    };
    const checkAndAdjustSliceSize = (dimension, size, sliceEndPosition) => {
        if (sliceEndPosition[dimension] > size[dimension]) {
            sliceEndPosition[dimension] = size[dimension];
        }
    };
    const GET_TENSOR_DIMENSION_ERROR_ROW_IS_UNDEFINED = new Error('Row is undefined');
    const GET_TENSOR_DIMENSION_ERROR_COL_IS_UNDEFINED = new Error('Column is undefined');
    const GET_TENSOR_DIMENSION_ERROR_PATCH_SIZE_IS_UNDEFINED = new Error('Patch Size is undefined');
    const GET_TENSOR_DIMENSION_ERROR_HEIGHT_IS_UNDEFINED = new Error('Height is undefined');
    const GET_TENSOR_DIMENSION_ERROR_WIDTH_IS_UNDEFINED = new Error('Width is undefined');
    const getTensorDimensions = ({ row, col, patchSize, height, width, padding = 0, }) => {
        if (row === undefined) {
            throw GET_TENSOR_DIMENSION_ERROR_ROW_IS_UNDEFINED;
        }
        if (col === undefined) {
            throw GET_TENSOR_DIMENSION_ERROR_COL_IS_UNDEFINED;
        }
        if (patchSize === undefined) {
            throw GET_TENSOR_DIMENSION_ERROR_PATCH_SIZE_IS_UNDEFINED;
        }
        if (height === undefined) {
            throw GET_TENSOR_DIMENSION_ERROR_HEIGHT_IS_UNDEFINED;
        }
        if (width === undefined) {
            throw GET_TENSOR_DIMENSION_ERROR_WIDTH_IS_UNDEFINED;
        }
        let yPatchSize = patchSize;
        let xPatchSize = patchSize;
        if (yPatchSize > height) {
            yPatchSize = height;
        }
        if (xPatchSize > width) {
            xPatchSize = width;
        }
        const origin = [
            row * patchSize - padding,
            col * patchSize - padding,
        ];
        const sliceOrigin = [padding, padding,];
        checkAndAdjustStartingPosition(0, origin, sliceOrigin);
        checkAndAdjustStartingPosition(1, origin, sliceOrigin);
        const endPosition = [
            origin[0] + yPatchSize + padding * 2,
            origin[1] + xPatchSize + padding * 2,
        ];
        const sliceEndPosition = [
            sliceOrigin[0] + yPatchSize,
            sliceOrigin[1] + xPatchSize,
        ];
        checkAndAdjustEndingPosition(height, 0, endPosition, origin, sliceOrigin, sliceEndPosition);
        checkAndAdjustEndingPosition(width, 1, endPosition, origin, sliceOrigin, sliceEndPosition);
        const size = [
            endPosition[0] - origin[0],
            endPosition[1] - origin[1],
        ];
        checkAndAdjustSliceSize(0, size, sliceEndPosition);
        checkAndAdjustSliceSize(1, size, sliceEndPosition);
        const sliceSize = [
            sliceEndPosition[0] - sliceOrigin[0],
            sliceEndPosition[1] - sliceOrigin[1],
        ];
        return {
            origin,
            sliceOrigin,
            size,
            sliceSize,
        };
    };
    function concatTensors(tensors, axis = 0) {
        const definedTensors = [];
        for (let i = 0; i < tensors.length; i++) {
            const tensor = tensors[i];
            if (tensor !== undefined) {
                definedTensors.push(tensor);
            }
        }
        if (definedTensors.length === 0) {
            throw GET_UNDEFINED_TENSORS_ERROR();
        }
        const concatenatedTensor = tf__namespace$1.concat(definedTensors, axis);
        tensors.forEach(tensor => tensor?.dispose());
        return concatenatedTensor;
    }
    const getPercentageComplete = (row, col, columns, total) => {
        const index = row * columns + col + 1;
        const percent = index / total;
        return percent;
    };
    const executeModel = (model, pixels) => {
        const predictedPixels = model.predict(pixels);
        if (!isTensor(predictedPixels)) {
            throw new Error(ERROR_INVALID_MODEL_PREDICTION);
        }
        if (isFourDimensionalTensor(predictedPixels)) {
            return predictedPixels;
        }
        throw new Error(ERROR_INVALID_TENSOR_PREDICTED(predictedPixels));
    };
    async function* predict(pixels, { output, progress, patchSize: patchSize, padding, progressOutput, }, { model, modelDefinition, }, { imageSize, inputSize, }) {
        const scale = modelDefinition.scale || 1;
        if (inputSize === undefined && patchSize && padding === undefined) {
            warn(WARNING_UNDEFINED_PADDING);
        }
        if (patchSize) {
            const [height, width,] = pixels.shape.slice(1);
            const { rows, columns, } = getRowsAndColumns(pixels, patchSize);
            yield;
            let upscaledTensor;
            const total = rows * columns;
            for (let row = 0; row < rows; row++) {
                let colTensor;
                yield [colTensor, upscaledTensor,];
                for (let col = 0; col < columns; col++) {
                    const { origin, size, sliceOrigin, sliceSize, } = getTensorDimensions({
                        row,
                        col,
                        patchSize,
                        padding,
                        height,
                        width,
                    });
                    yield [upscaledTensor, colTensor,];
                    const slicedPixels = pixels.slice([0, origin[0], origin[1],], [-1, size[0], size[1],]);
                    yield [upscaledTensor, colTensor, slicedPixels,];
                    const prediction = executeModel(model, slicedPixels);
                    slicedPixels.dispose();
                    yield [upscaledTensor, colTensor, prediction,];
                    const startSlice = [0, sliceOrigin[0] * scale, sliceOrigin[1] * scale,];
                    const endSlice = [-1, sliceSize[0] * scale, sliceSize[1] * scale,];
                    const slicedPrediction = prediction.slice(startSlice, endSlice);
                    prediction.dispose();
                    yield [upscaledTensor, colTensor, slicedPrediction,];
                    const processedPrediction = processAndDisposeOfTensor(slicedPrediction, modelDefinition.postprocess, scaleOutput(modelDefinition.outputRange));
                    yield [upscaledTensor, colTensor, processedPrediction,];
                    if (progress !== undefined && isProgress(progress)) {
                        const percent = getPercentageComplete(row, col, columns, total);
                        if (isSingleArgProgress(progress)) {
                            progress(percent);
                        }
                        else {
                            const squeezedTensor = processedPrediction.squeeze();
                            if (isMultiArgTensorProgress(progress, output, progressOutput)) {
                                progress(percent, squeezedTensor, row, col);
                            }
                            else {
                                const src = tensorAsBase64(squeezedTensor);
                                squeezedTensor.dispose();
                                progress(percent, src, row, col);
                            }
                        }
                    }
                    yield [upscaledTensor, colTensor, processedPrediction,];
                    colTensor = concatTensors([colTensor, processedPrediction,], 2);
                    processedPrediction.dispose();
                    yield [upscaledTensor, colTensor,];
                }
                upscaledTensor = concatTensors([upscaledTensor, colTensor,], 1);
                colTensor.dispose();
                yield [upscaledTensor,];
            }
            const processedUpscaledTensor = processAndDisposeOfTensor(upscaledTensor.clone(), trimInput(imageSize, scale));
            upscaledTensor?.dispose();
            yield [processedUpscaledTensor,];
            const squeezedTensor = processedUpscaledTensor.squeeze();
            processedUpscaledTensor.dispose();
            return squeezedTensor;
        }
        if (progress) {
            warn(WARNING_PROGRESS_WITHOUT_PATCH_SIZE);
        }
        const prediction = model.predict(pixels);
        yield [prediction,];
        const postprocessedTensor = processAndDisposeOfTensor(prediction.clone(), modelDefinition.postprocess, scaleOutput(modelDefinition.outputRange), trimInput(imageSize, scale));
        prediction.dispose();
        yield [postprocessedTensor,];
        const squeezedTensor = postprocessedTensor.squeeze();
        postprocessedTensor.dispose();
        return squeezedTensor;
    }
    const getCopyOfInput = (input) => (isTensor(input) ? input.clone() : input);
    async function* upscale(input, args, { model, modelDefinition, }) {
        const parsedInput = getCopyOfInput(input);
        const startingPixels = await getImageAsTensor(parsedInput);
        yield startingPixels;
        const imageSize = startingPixels.shape;
        const inputSize = getInputShape(model);
        const preprocessedPixels = processAndDisposeOfTensor(startingPixels, modelDefinition.preprocess, scaleIncomingPixels(modelDefinition.inputRange), padInput(inputSize));
        yield preprocessedPixels;
        const gen = predict(preprocessedPixels, args, {
            model,
            modelDefinition,
        }, {
            imageSize,
            inputSize,
        });
        let result = await gen.next();
        yield result.value;
        while (!result.done) {
            result = await gen.next();
            if (Array.isArray(result.value)) {
                yield [...result.value, preprocessedPixels,];
            }
            else if (isTensor(result.value)) {
                yield [result.value, preprocessedPixels,];
            }
            else {
                yield preprocessedPixels;
            }
        }
        preprocessedPixels.dispose();
        const upscaledPixels = result.value;
        if (args.output === 'tensor') {
            return upscaledPixels;
        }
        const base64Src = tensorAsBase64(upscaledPixels);
        upscaledPixels.dispose();
        return base64Src;
    }
    async function cancellableUpscale(input, { signal, awaitNextFrame, ...args }, internalArgs) {
        checkValidEnvironment(input, {
            output: args.output,
            progressOutput: args.progressOutput,
        });
        const tick = makeTick(signal || internalArgs.signal, awaitNextFrame);
        await tick();
        const upscaledPixels = await wrapGenerator(upscale(input, args, internalArgs), tick);
        await tick();
        return upscaledPixels;
    }

    const DEFAULT_MODEL = DefaultUpscalerModel__default["default"];
    class Upscaler {
        _opts;
        _model;
        _ready;
        _abortController = new AbortController();
        constructor(opts = {}) {
            this._opts = {
                ...opts,
            };
            this._model = loadModel(getModel(this._opts.model || DEFAULT_MODEL));
            this._ready = cancellableWarmup(this._model, (this._opts.warmupSizes || []), undefined, {
                signal: this._abortController.signal,
            });
        }
        async upscale(image, options) {
            await this._ready;
            const { model, modelDefinition, } = await this._model;
            return cancellableUpscale(image, getUpscaleOptions(model, options), {
                model,
                modelDefinition,
                signal: this._abortController.signal,
            });
        }
        warmup = async (warmupSizes = [], options) => {
            await this._ready;
            return cancellableWarmup(this._model, warmupSizes, options, {
                signal: this._abortController.signal,
            });
        };
        abort = () => {
            this._abortController.abort();
            this._abortController = new AbortController();
        };
        dispose = async () => {
            await this._ready;
            const { model, } = await this._model;
            model.dispose();
        };
        getModel = () => this._model;
    }

    Upscaler.getRowsAndColumns = getRowsAndColumns;
    Upscaler.getTensorDimensions = getTensorDimensions;
    Upscaler.AbortError = AbortError;

    return Upscaler;

}));