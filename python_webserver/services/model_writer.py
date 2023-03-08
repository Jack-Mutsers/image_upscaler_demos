from basicsr.archs.rrdbnet_arch import RRDBNet
from basicsr.utils.download_util import load_file_from_url
from torch.autograd import Variable
# from onnx2keras import onnx_to_keras
from realesrgan.archs.srvgg_arch import SRVGGNetCompact
# from onnx_tf.backend import prepare

import onnx
import torch
import numpy as np
import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class Model_writer:
    def __init__(self):
        self.project_dir = os.path.dirname(ROOT_DIR)
        
        self.scale = 4
        self.upsampler = self.setup_upsampler()
        

    def setup_upsampler(self):
        gpu_id = 0
        device=None
        # model_name = "RealESRGAN_x4plus"
        # model_name = "RealESRNet_x4plus"
        model_name = "realesr-general-x4v3"
        # model_name = "RRDB_ESRGAN_x4"
        # model_name = "4x_RealisticRescaler_100000_G"
        
        model = None
        file_url = ['']

        # determine models according to model names
        if model_name == 'RealESRGAN_x4plus':  # x4 RRDBNet model
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            self.scale = 4
            file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth']
        elif model_name == 'RealESRNet_x4plus':  # x4 RRDBNet model
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            self.scale = 4
            file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.1/RealESRNet_x4plus.pth']
        elif model_name == 'RRDB_ESRGAN_x4':  # x4 RRDBNet model
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            self.scale = 4
            file_url = ['']
        elif model_name == '4x_RealisticRescaler_100000_G':  # x4 RRDBNet model
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            self.scale = 4
            file_url = ['']
        elif model_name == '4xSmoothRealism':  # x4 SmoothRealism model
            model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type='prelu')
            self.scale = 4
            file_url = ['https://drive.google.com/u/0/uc?id=1Uc9RUc2YpZKpPoGQeGxNUb3Ro-U720cH&export=download']
        elif model_name == 'RealESRGAN_x4plus_anime_6B':  # x4 RRDBNet model with 6 blocks
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=6, num_grow_ch=32, scale=4)
            self.scale = 4
            file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth']
        elif model_name == 'RealESRGAN_x2plus':  # x2 RRDBNet model
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
            self.scale = 2
            file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth']
        elif model_name == 'realesr-animevideov3':  # x4 VGG-style model (XS size)
            model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=16, upscale=4, act_type='prelu')
            self.scale = 4
            file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-animevideov3.pth']
        elif model_name == 'realesr-general-x4v3':  # x4 VGG-style model (S size)
            model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type='prelu')
            self.scale = 4
            file_url = [
                'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-wdn-x4v3.pth',
                'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth'
            ]

        # determine model paths
        model_path = "/models/" + model_name + '.pth'
        if not os.path.isfile(model_path):
            model_path = os.path.join(self.project_dir, 'models', model_name + '.pth')

        if not os.path.isfile(model_path):
            for url in file_url:
                # model_path will be updated
                model_path = load_file_from_url(url=url, model_dir=os.path.join(self.project_dir, 'models'), progress=True, file_name=None)
        
        print(model_path)

        # use dni to control the denoise strength
        dni_weight = None
        denoise_strength = 0.5
        if len(file_url) > 1 and model_name == 'realesr-general-x4v3' and denoise_strength != 1:
            wdn_model_path = model_path.replace('realesr-general-x4v3', 'realesr-general-wdn-x4v3')
            model_path = [model_path, wdn_model_path]
            dni_weight = [denoise_strength, 1 - denoise_strength]

        if isinstance(model_path, list):
            # dni
            assert len(model_path) == len(dni_weight), 'model_path and dni_weight should have the save length.'
            loadnet = self.dni(model_path[0], model_path[1], dni_weight)
        else:
            # if the model_path starts with https, it will first download models to the folder: weights
            if model_path.startswith('https://'):
                model_path = load_file_from_url(
                    url=model_path, model_dir=os.path.join(ROOT_DIR, 'weights'), progress=True, file_name=None)
            loadnet = torch.load(model_path, map_location=torch.device('cpu'))

        
        
        # initialize model
        if gpu_id:
            device = torch.device(
                f'cuda:{gpu_id}' if torch.cuda.is_available() else 'cpu') if device is None else device
        else:
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu') if device is None else device




        # prefer to use params_ema
        if 'params_ema' in loadnet:
            keyname = 'params_ema'
        else:
            keyname = 'params'

        test_model = model
        test_model.load_state_dict(loadnet[keyname], strict=True)

        test_model.eval()
        test_model = test_model.to(device)

        self.stored_model_path = os.path.join(self.project_dir, "stored_models", model_name+ ".pt")

        if not os.path.exists(os.path.join(self.project_dir, "stored_models")):
            os.mkdir(os.path.join(self.project_dir, "stored_models"))


        torch.save(test_model, self.stored_model_path)
        self.to_onnx()

    def to_onnx(self):
        model = self.get_model()
        
        model.eval()

        # set the train mode to false since we will only run the forward pass.
        model.train(False)

        self.onnx_model = self.stored_model_path.replace(".pt", ".onnx")

        # An example input
        dummy_input = torch.rand(1, 3, 256, 256)

        input_np = np.random.uniform(0, 1, (1, 3, 256, 256))
        dummy_input = Variable(torch.FloatTensor(input_np))
        
        dummy_input = torch.randn(1, 3, 256, 256, device="cuda")

        input_names=['input']
        output_names=['output']
        dynamic_axes= {'input':{0:'batch_size' , 2:'width', 3:'height'}, 'output':{0:'batch_size' , 2:'width', 3:'height'}} #adding names for better debugging

        # Export the model
        with torch.no_grad():
            # torch_out = torch.onnx._export(model, dummy_input, self.onnx_model, opset_version=11, export_params=True)
            torch.onnx.export(model,
                dummy_input,
                self.onnx_model,
                export_params=True,
                opset_version=15,
                do_constant_folding=True,
                input_names=input_names,
                output_names=output_names,
                dynamic_axes=dynamic_axes
            )
            
        # print("")
        # print(torch_out.shape)
        # print("")

        # Check the model
        print("")

        try:
            onnx_model = onnx.load(self.onnx_model)
            model_with_shapes = onnx.shape_inference.infer_shapes(onnx_model)

            onnx.checker.check_model(onnx_model)
        except onnx.checker.ValidationError as e:
            print("The onnx model is invalid: %s" % e)
        else:
            print("The onnx model is valid!")

        print("")

        # self.to_tensorflow()


    def to_tensorflow(self):
        # # Load ONNX model
        # onnx_model = onnx.load(self.onnx_model)

        # # Call the converter (input - is the main model input name, can be different for your model)
        # k_model = onnx_to_keras(onnx_model, ['input'])

        test = 0

    def get_model(self):
        model = torch.load(self.stored_model_path)
        model.eval()
        return model


    def dni(self, net_a, net_b, dni_weight, key='params', loc='cpu'):
        """Deep network interpolation.

        ``Paper: Deep Network Interpolation for Continuous Imagery Effect Transition``
        """
        net_a = torch.load(net_a, map_location=torch.device(loc))
        net_b = torch.load(net_b, map_location=torch.device(loc))
        for k, v_a in net_a[key].items():
            net_a[key][k] = dni_weight[0] * v_a + dni_weight[1] * net_b[key][k]
        return net_a