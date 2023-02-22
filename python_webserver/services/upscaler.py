from basicsr.archs.rrdbnet_arch import RRDBNet
from basicsr.utils.download_util import load_file_from_url

from realesrgan import RealESRGANer
from realesrgan.archs.srvgg_arch import SRVGGNetCompact

import os

class Upscaler:
    def __init__(self):
        ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
        self.project_dir = os.path.dirname(ROOT_DIR)
        
        self.scale = 4
        self.upsampler = self.setup_upsampler()
        

    def setup_upsampler(self):
        # model_name = "RealESRGAN_x4plus"
        model_name = "RealESRNet_x4plus"
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
        if model_name == 'realesr-general-x4v3' and denoise_strength != 1:
            wdn_model_path = model_path.replace('realesr-general-x4v3', 'realesr-general-wdn-x4v3')
            model_path = [model_path, wdn_model_path]
            dni_weight = [denoise_strength, 1 - denoise_strength]

        # restorer
        return RealESRGANer(
            scale = self.scale,
            model_path = model_path,
            dni_weight = dni_weight,
            model = model,
            tile = 0,
            tile_pad = 10,
            pre_pad = 0,
            half = False,
            gpu_id = 0
        )

    async def scale_image(self, img, face_enhance = False):

        if face_enhance:  # Use GFPGAN for face enhancement
            from gfpgan import GFPGANer
            face_enhancer = GFPGANer(
                model_path = 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth',
                upscale = self.scale,
                arch = 'clean',
                channel_multiplier = 2,
                bg_upsampler = self.upsampler)

        print("scaling image")
        
        # img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        colored_image = None
        try:
            if face_enhance:
                _, _, output = face_enhancer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
            else:
                output, _ = self.upsampler.enhance(img, outscale=self.scale)

            colored_image = output
            # colored_image = cv2.cvtColor(output, cv2.COLOR_BAYER_BG2RGB)
            
            print("image scaled")

        except RuntimeError as error:
            print('Error', error)
            print('If you encounter CUDA out of memory, try to set --tile with a smaller number.')

        return colored_image
