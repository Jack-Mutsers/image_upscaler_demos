from PIL import Image
import cv2
import glob
import os
from basicsr.archs.rrdbnet_arch import RRDBNet
from basicsr.utils.download_util import load_file_from_url

from realesrgan import RealESRGANer

model_name = "RealESRGAN_x4plus"
denoise_strength = 0.5
tile = 0
tile_pad = 10
pre_pad = 0
fp32 = ""
gpu_id = None
outscale = 4
face_enhance = False
ext = 'auto'
suffix = ''

input = "./inputs/"

def main():

    # determine models according to model names
    if model_name == 'RealESRGAN_x4plus':  # x4 RRDBNet model
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        netscale = 4
        file_url = ['https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth']

    # determine model paths
    model_path = os.path.join('weights', "./models/" + model_name + '.pth')
    if not os.path.isfile(model_path):
        ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
        for url in file_url:
            # model_path will be updated
            model_path = load_file_from_url(url=url, model_dir=os.path.join(ROOT_DIR, 'weights'), progress=True, file_name=None)

    # use dni to control the denoise strength
    dni_weight = None
    if model_name == 'realesr-general-x4v3' and denoise_strength != 1:
        wdn_model_path = model_path.replace('realesr-general-x4v3', 'realesr-general-wdn-x4v3')
        model_path = [model_path, wdn_model_path]
        dni_weight = [denoise_strength, 1 - denoise_strength]

    # restorer
    upsampler = RealESRGANer(
        scale=netscale,
        model_path=model_path,
        dni_weight=dni_weight,
        model=model,
        tile=tile,
        tile_pad=tile_pad,
        pre_pad=pre_pad,
        half=not fp32,
        gpu_id=gpu_id)

    if face_enhance:  # Use GFPGAN for face enhancement
        from gfpgan import GFPGANer
        face_enhancer = GFPGANer(
            model_path = 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth',
            upscale = outscale,
            arch = 'clean',
            channel_multiplier = 2,
            bg_upsampler = upsampler)

    if os.path.isfile(input):
        paths = [input]
    else:
        paths = sorted(glob.glob(os.path.join(input, '*')))

    for idx, path in enumerate(paths):
        imgname, extension = os.path.splitext(os.path.basename(path))
        print('Testing', idx, imgname)

        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if len(img.shape) == 3 and img.shape[2] == 4:
            img_mode = 'RGBA'
        else:
            img_mode = None

        try:
            if face_enhance:
                _, _, output = face_enhancer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
            else:
                output, _ = upsampler.enhance(img, outscale=outscale)
        except RuntimeError as error:
            print('Error', error)
            print('If you encounter CUDA out of memory, try to set --tile with a smaller number.')

        else:
            if ext == 'auto':
                extension = extension[1:]
            else:
                extension = ext
                
            if img_mode == 'RGBA':  # RGBA images should be saved in png format
                extension = 'png'

            # if suffix == '':
            #     save_path = os.path.join(output, f'{imgname}.{extension}')
            # else:
            #     save_path = os.path.join(output, f'{imgname}_{suffix}.{extension}')

            # cv2.imwrite(save_path, output)
            colored_image = cv2.cvtColor(output, cv2.COLOR_BGR2RGBA)

            img = Image.fromarray(colored_image)
            
            return img

    return None
