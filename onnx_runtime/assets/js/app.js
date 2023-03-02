// Load the ONNX model
// const modelUrl = '../models/ONNX/003_realSR_BSRGAN_DFO_s64w8_SwinIR-M_x4_GAN.onnx';
const modelUrl = '../models/ONNX/RealESRGAN_x4plus.onnx';
const model = await axios.get(modelUrl, { responseType: 'arraybuffer' });

// Initialize the ONNX Runtime
const session = new onnx.InferenceSession();
await session.loadModelFromBuffer(model.data);

// Prepare the input data
const inputData = new Float32Array([1.0, 2.0, 3.0, 4.0]);
const inputTensor = new onnx.Tensor(inputData, 'float32', [1, 4]);

// Run the inference
const output = await session.run({ input: inputTensor });

// Process the output data
const outputTensor = output.output;
const outputData = outputTensor.data;
console.log(outputData);