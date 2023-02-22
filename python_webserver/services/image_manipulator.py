from PIL import Image, ImageCms
from .upscaler import Upscaler
import base64
import numpy as np
import cv2
from io import BytesIO


class Image_manipulator:

    def __init__(self):
        self.upscaler = Upscaler()

    async def convert_image(self, filestr, file_type = "png"):
        mime_type = self.validate_mime_type(file_type)

        if mime_type is False:
            return False

        pil_img = Image.open(filestr)
        srgb_img = self.convert_to_sRGB(pil_img)

        # Convert the image to OpenCV format
        open_cv_image = cv2.cvtColor(np.array(srgb_img), cv2.COLOR_RGB2BGR)

        print("image loaded")

        colored_image = await self.upscaler.scale_image(open_cv_image)

        # cv2.imshow("test", colored_image)
        # cv2.waitKey(0)

        img_encode = cv2.imencode('.' + mime_type, colored_image)[1]
        data_encode = np.array(img_encode)
        byte_encode = data_encode.tobytes()

        base64_encode = base64.b64encode(byte_encode)
        utf8_string = base64_encode.decode('utf-8')

        img_string = "data:image/" + mime_type + ";charset=utf-8;base64," + utf8_string

        return img_string

    def validate_mime_type(self, file_type):
        if "image" not in file_type:
            print("invalid filetype: "+ file_type)
            return False
        
        mime_type = file_type.replace("image/", "")

        if mime_type == "jpg":
            mime_type = "jpeg"

        return mime_type

    def get_image_profile(self, img, description_only = False):
        icc_profile = img.info.get('icc_profile', '')

        src_profile = ""
        # Decode the ICC profile information
        if icc_profile:
            io_profile = BytesIO(icc_profile)
            profile = ImageCms.getOpenProfile(io_profile)
            src_profile = profile.profile
        
        if description_only:
            return src_profile.profile_description if src_profile else "No icc profile detected"

        return src_profile
        
    def convert_to_sRGB(self, img):
        src_profile = self.get_image_profile(img)

        # Convert the image to sRGB using a color profile
        srgb_profile = ImageCms.createProfile('sRGB')

        srgb_img = img
        if(src_profile):
            srgb_img = ImageCms.profileToProfile(img, src_profile, srgb_profile)

        return srgb_img
