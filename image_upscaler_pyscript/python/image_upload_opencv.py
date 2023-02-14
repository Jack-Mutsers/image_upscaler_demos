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

    if "image" not in file_type:
        console.log("invalid filetype: ", file_type)
        return
    
    mime_type = file_type.replace("image/", "")

    if mime_type == "jpg":
        mime_type = "jpeg"

    #Get the data from the files arrayBuffer as an array of unsigned bytes
    array_buf = Uint8Array.new(await file.arrayBuffer())

    #BytesIO wants a bytes-like object, so convert to bytearray first
    bytes_list = bytearray(array_buf)
    my_bytes = io.BytesIO(bytes_list) 

    #Create PIL image from np array
    my_image = Image.open(my_bytes)

    open_cv_image = np.array(my_image) 
    colored_image = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2RGBA)

    img_encode = cv2.imencode('.' + file_type, colored_image)[1]
    data_encode = np.array(img_encode)
    byte_encode = data_encode.tobytes()

    base64_encode = base64.b64encode(byte_encode)
    utf8_string = base64_encode.decode('utf-8')

    img_string = "data:image/" + file_type + ";charset=utf-8;base64," + utf8_string

    #Create new tag and insert into page
    new_image_anchor = document.createElement('a')
    new_image_anchor.href = img_string
    new_image_anchor.setAttribute("download", file.name)

    new_image = document.createElement('img')
    new_image.src = img_string
    new_image_anchor.appendChild(new_image)
    document.getElementById("output_upload").appendChild(new_image_anchor)


# Run image processing code above whenever file is uploaded    
upload_file = create_proxy(_upload_change_and_show)
document.getElementById("file-upload-pillow").addEventListener("change", upload_file)