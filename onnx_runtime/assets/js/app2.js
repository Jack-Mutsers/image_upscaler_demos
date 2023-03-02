
// import Jimp from 'jimp';

// const url = '/assets/models/ONNX/003_realSR_BSRGAN_DFO_s64w8_SwinIR-M_x4_GAN.onnx';
const url = '/assets/models/ONNX/realesr-general-x4v3.onnx';
// const url = '/assets/models/ONNX/RealESRGAN_x4plus.onnx';
const image_url = '/assets/images/dogs.jpg';

async function loadModel() {
  console.log("loading model");
    // Load the RealESRGAN_x4plus ONNX model
    const model = await fetch(url);
    const modelBuffer = await model.arrayBuffer();
    
    // Initialize the ONNX Runtime session
    const session = await ort.InferenceSession.create(url);
    await session.loadModelFromBuffer(modelBuffer);

    console.log("model loaded");

    return session;
}

async function loadImage(url) {
    console.log("loading image");
    const image = await Jimp.read(url);
    console.log(image);
    return image;
}

function preprocessImage(image) {
  console.log("proces image");
  
  // Resize the image to the required input size (192x192)
  image.resize(192, 192);

  // Convert the image to RGB format
  image.color([
    { apply: 'red', params: [ 'green', 'blue' ] },
    { apply: 'green', params: [ 'red', 'blue' ] },
    { apply: 'blue', params: [ 'red', 'green' ] },
  ]);

  // Normalize pixel values to the range [0, 1]
  image.normalize();
  
  // Convert the image to a Float32Array for input to the model
  const pixels = image.bitmap.data;
  const input = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    input[i] = pixels[i] / 255.0;
  }
  
  // Return the preprocessed input
  return input;
}

async function main(){
    // Usage:
    const session = await loadModel();

    // Usage:
    const image = await loadImage(image_url);
    const input = preprocessImage(image);
    
    const inputTensor = new ort.Tensor(input, 'float32', [1, 3, 192, 192]);
    
    console.log("Scale image");
    // Run inference on the inputTensor using the session
    const outputMap = await session.run({ input: inputTensor });
    console.log(outputMap);
}

main();