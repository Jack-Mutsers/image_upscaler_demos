from torch.autograd import Variable

import torch.onnx
import torchvision
import torch

model = torchvision.models.resnet34()
dummy_input = Variable(torch.randn(1, 4, 480, 480))
state_dict = torch.load('./RealESRGAN_x4plus.pth')
model.load_state_dict(state_dict)
torch.onnx.export(model, dummy_input, "moment-in-time.onnx")