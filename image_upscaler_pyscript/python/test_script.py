from PIL import Image
import cv2

path = "2019-06-22_141715.jpg"
def test():
    image = cv2.imread(path)
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    colored_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)

    img = Image.fromarray(colored_image)

    return img