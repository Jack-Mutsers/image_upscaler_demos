from js import document, console, Uint8Array, window, File
from pyodide import create_proxy
from PIL import Image
import base64
import numpy as np
import cv2
import io

async def _upload_change_and_show(e):
    #Get the first file from upload
    file_list = e.target.files

    for file in file_list:
        console.log(file)
        await show_image(file)

async def show_image(file):
    file_type = file.type

    if "jpg" in file_type or "jpeg" in file_type:
        file_type = "jpg"

    elif "png" in file_type:
        file_type = "png"

    # force png export
    file_type = "png"

    #Get the data from the files arrayBuffer as an array of unsigned bytes
    array_buf = Uint8Array.new(await file.arrayBuffer())

    #BytesIO wants a bytes-like object, so convert to bytearray first
    bytes_list = bytearray(array_buf)
    my_bytes = io.BytesIO(bytes_list) 

    #Create PIL image from np array
    my_image = Image.open(my_bytes)

    open_cv_image = np.array(my_image) 
    colored_image = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2RGBA)

    _, im_arr = cv2.imencode('.' + file_type, colored_image)  # im_arr: image in Numpy one-dim array format.
    im_bytes = im_arr.tobytes()
    im_b64 = base64.b64encode(im_bytes)
    string = im_b64.decode('utf-8')

    img = "data:image/" + file_type + ";charset=utf-8;base64," + string

    #Create new tag and insert into page
    new_image = document.createElement('img')
    new_image.src = img
    document.getElementById("output_upload").appendChild(new_image)


# Run image processing code above whenever file is uploaded    
upload_file = create_proxy(_upload_change_and_show)
document.getElementById("file-upload-pillow").addEventListener("change", upload_file)