from torchvision.transforms import ToTensor
from subprocess import call
from PIL import Image

import torch
import sys
import os

def model_setup():
    ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(ROOT_DIR)

    model_name = "RealESRNet_x4plus"

    model_path = "/models/" + model_name + '.pth'
    if not os.path.isfile(model_path):
        model_path = os.path.join(project_dir, 'models', model_name + '.pth')
        print(model_path)
    
    return model_path

def check_device_setings():
    print('__Python VERSION:', sys.version)
    print('__pyTorch VERSION:', torch.__version__)
    print('__CUDA VERSION')
    # call(["nvcc", "--version"]) does not work
    # ! nvcc --version
    print('__CUDNN VERSION:', torch.backends.cudnn.version())
    print('__Number CUDA Devices:', torch.cuda.device_count())
    print('__Devices')
    call(["nvidia-smi", "--format=csv", "--query-gpu=index,name,driver_version,memory.total,memory.used,memory.free"])
    print("CUDA activated: ", torch.cuda.is_available())
    print('CUDA Device: GPU', torch.cuda.current_device())
    print ('Available devices ', torch.cuda.device_count())
    print ('Current CUDA device ', torch.cuda.current_device())
    

# this finction is currently not functional
def test_upascaling(string_path):
    model_path = model_setup()


    # Load the RealESRNet model
    model = torch.load(model_path)

    # Load the input image
    img = Image.open(string_path)

    # Preprocess the input image
    img_tensor = ToTensor()(img)
    img_tensor = img_tensor.unsqueeze(0) # Add batch dimension
    img_tensor = img_tensor.cuda() # Move tensor to GPU if available

    # Run the image through the RealESRNet model
    with torch.no_grad():
        output_tensor = model(img_tensor)

    # Postprocess the output tensor
    output_img = output_tensor.squeeze(0).cpu()
    output_img = output_img.permute(1, 2, 0) # Convert tensor back to image format
    output_img = (output_img * 255).clamp(0, 255).byte() # Normalize pixel values

    
    path_split = string_path.split(".")
    path_split[-2] = "upscaled_image"
    new_path = ".".join(path_split)

    # Save the output image
    output_img.save(new_path)

