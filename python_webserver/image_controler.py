from flask import Flask, json, request
from flask_cors import CORS
from services import Image_manipulator
# from services import Model_writer
# from services import Image_tester

allowed_origins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:80",
    "http://localhost:80",
    "*"
]

# MW = Model_writer()
IM = Image_manipulator()

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
    filestr = file.stream

    # IT = Image_tester(file, IM)
    # IT.create_temp_images(analyse = True)
    # IT.image_load_test()
    # IT.cleanup()

    print(file.content_type)

    image = await IM.convert_image(filestr, file.content_type)

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


if __name__ == '__main__':
    api.run() 
