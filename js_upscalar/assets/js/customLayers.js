class MultiplyBeta extends tf.layers.Layer {
    beta;
  
    constructor() {
        super({});
        this.beta = BETA;
    }
  
    call(inputs) {
        return tf.mul(getInput(inputs), this.beta);
    }
  
    static className = 'MultiplyBeta';
}
  
class PixelShuffle extends tf.layers.Layer {
    scale;
  
    constructor() {
        super({});
        this.scale = SCALE;
    }
  
    computeOutputShape(inputShape) {
        return [inputShape[0], inputShape[1], inputShape[2], 3];
    }
  
    call(inputs) {
        return tf.depthToSpace(getInput(inputs), this.scale, 'NHWC');
    }
  
    static className = 'PixelShuffle';
}

tf.serialization.registerClass(MultiplyBeta);
tf.serialization.registerClass(PixelShuffle);