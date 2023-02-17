from flask import Flask, json, request
from flask_cors import CORS
import upscaler
import base64
import numpy as np
import cv2
from io import BytesIO
from PIL import Image
import os

from flask import Flask, request

allowed_origins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

api = Flask(__name__)
CORS(api, resources={r"/api/*": {"origins": allowed_origins}})

@api.after_request
def after_request(response):
    if request.headers['Origin'] in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = request.headers['Origin'] 
        response.headers['Access-Control-Allow-Methods'] = 'PUT,GET,POST,DELETE'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    return response

@api.route('/api/upscale', methods=['POST'])
async def _upload_change_and_show():
    #read image file string data
    file = request.files['file']
    filestr = file.read()

    # pil_img = Image.open(request.files['file'].stream)
    # pil_img.show()

    # string_path = os.path.dirname(os.path.abspath(__file__)) + "/tmp/" + file.filename

    # string_path = string_path.replace("jpg","png")

    # pil_img.save(string_path, format="png") # save the content to temp

    print(file.content_type)

    image = await convert_image(filestr, file.content_type)

    response = None
    if image is False:
        response = api.response_class(
            response= json.dumps("Invalid filetype detected: " + file.content_type),
            status=400,
            mimetype='application/json'
        )
    else:
        response = api.response_class(
            response= json.dumps(image),
            status=200,
            mimetype='application/json'
        )

    return response

async def convert_image(filestr, file_type = "png"):

    if "image" not in file_type:
        print("invalid filetype: "+ file_type)
        return False
    
    mime_type = file_type.replace("image/", "")

    if mime_type == "jpg":
        mime_type = "jpeg"

    #convert string data to numpy array
    file_bytes = np.frombuffer(filestr, np.uint8)

    # convert numpy array to image
    open_cv_image = cv2.imdecode(file_bytes, cv2.IMREAD_UNCHANGED)

    print("image loaded")

    colored_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2RGBA)
    colored_image = await upscaler.scale_image(colored_image)

    # cv2.imshow("test", colored_image)
    # cv2.waitKey(0)

    img_encode = cv2.imencode('.' + mime_type, colored_image)[1]
    data_encode = np.array(img_encode)
    byte_encode = data_encode.tobytes()

    base64_encode = base64.b64encode(byte_encode)
    utf8_string = base64_encode.decode('utf-8')

    img_string = "data:image/" + mime_type + ";charset=utf-8;base64," + utf8_string

    return img_string

if __name__ == '__main__':
    api.run() 
