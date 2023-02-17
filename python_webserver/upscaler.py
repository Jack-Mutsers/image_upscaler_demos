from PIL import Image
import cv2
import os
from basicsr.archs.rrdbnet_arch import RRDBNet
from basicsr.utils.download_util import load_file_from_url

from realesrgan import RealESRGANer
from realesrgan.archs.srvgg_arch import SRVGGNetCompact

# model_name = "RealESRGAN_x4plus"
model_name = "RealESRNet_x4plus"
# model_name = "RRDB_ESRGAN_x4"
# model_name = "4x_RealisticRescaler_100000_G"

denoise_strength = 0.5
tile = 0
tile_pad = 10
pre_pad = 0
fp32 = False
gpu_id = 1
outscale = 4
ext = 'auto'
suffix = ''
file_url = "" 
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

# determine models according to model names
if model_name == 'RealESRGAN_x4plus':  # x4 RRDBNet model
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    netscale = 4
    file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth']
elif model_name == 'RealESRNet_x4plus':  # x4 RRDBNet model
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    netscale = 4
    file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.1/RealESRNet_x4plus.pth']
elif model_name == 'RRDB_ESRGAN_x4':  # x4 RRDBNet model
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    netscale = 4
    file_url = ['']
elif model_name == '4x_RealisticRescaler_100000_G':  # x4 RRDBNet model
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    netscale = 4
    file_url = ['']
elif model_name == '4xSmoothRealism':  # x4 SmoothRealism model
    model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type='prelu')
    netscale = 4
    file_url = ['https://drive.google.com/u/0/uc?id=1Uc9RUc2YpZKpPoGQeGxNUb3Ro-U720cH&export=download']

# determine model paths
model_path = "/models/" + model_name + '.pth'
if not os.path.isfile(model_path):
    model_path = os.path.join(ROOT_DIR, 'models', model_name + '.pth')
    print(model_path)

if not os.path.isfile(model_path):
    for url in file_url:
        # model_path will be updated
        model_path = load_file_from_url(url=url, model_dir=os.path.join(ROOT_DIR, 'models'), progress=True, file_name=None)
        print(model_path)

# use dni to control the denoise strength
dni_weight = None
if model_name == 'realesr-general-x4v3' and denoise_strength != 1:
    wdn_model_path = model_path.replace('realesr-general-x4v3', 'realesr-general-wdn-x4v3')
    model_path = [model_path, wdn_model_path]
    dni_weight = [denoise_strength, 1 - denoise_strength]

# restorer
upsampler = RealESRGANer(
    scale = netscale,
    model_path = model_path,
    dni_weight = dni_weight,
    model = model,
    tile = tile,
    tile_pad = tile_pad,
    pre_pad = pre_pad,
    half = fp32,
    gpu_id = gpu_id)

async def scale_image(img, face_enhance = False):

    if face_enhance:  # Use GFPGAN for face enhancement
        from gfpgan import GFPGANer
        face_enhancer = GFPGANer(
            model_path = 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth',
            upscale = outscale,
            arch = 'clean',
            channel_multiplier = 2,
            bg_upsampler = upsampler)

    print("scaling image")
    
    # img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    colored_image = None
    try:
        if face_enhance:
            _, _, output = face_enhancer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
        else:
            output, _ = upsampler.enhance(img, outscale=outscale)

        colored_image = output
        # colored_image = cv2.cvtColor(output, cv2.COLOR_BAYER_BG2RGB)
        
        print("image scaled")

    except RuntimeError as error:
        print('Error', error)
        print('If you encounter CUDA out of memory, try to set --tile with a smaller number.')

    return colored_image
