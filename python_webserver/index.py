from glob import glob
import upscaler
import cv2
from syncer import sync
from PIL import Image


images = glob('js_upscalar/assets/images/*')
# images = ["js_upscalar/assets/images\baboon-original - kopie (2).png"]

@sync
async def run():
    for image in images:
        if 'baboon-original' in image:
            continue

        print(image)

        img = cv2.imread(image)
        
        colored_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA)
        # scaled_img = await upscaler.scale_image(img)

        im_pil = Image.fromarray(colored_image)
        im_pil.show()

if __name__ == '__main__':
    run() 
