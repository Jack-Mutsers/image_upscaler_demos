from PIL import Image, ImageStat, ImageOps
from skimage.metrics import structural_similarity as ssim
from skimage.color import rgb2gray

import skimage.io as sio
import numpy as np
import cv2
import os
import atexit
import shutil

class Image_tester:

    def __init__(self, file, image_manipulator):
        ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
        self.project_dir = os.path.dirname(ROOT_DIR)

        self.string_path = ""
        self.copy_path = ""
        self.temp_folder = self.project_dir + "/tmp"
        self.img1 = None
        self.img2 = None
        self.file = file
        self.IM = image_manipulator

        if os.path.exists(self.temp_folder) is False:
            os.makedirs(self.temp_folder)
        
        # Register the cleanup function to be called on program exit
        atexit.register(self.cleanup)

    def cleanup(self):
        if os.path.exists(self.temp_folder):
            shutil.rmtree(self.temp_folder)

    def image_load_test(self):
        if self.file is False:
            return

        if self.string_path == "":
            self.string_path = self.temp_folder + "/image.png"

        # Open the Adobe RGB image
        adobe_rgb_img = Image.open(self.file.stream)
        adobe_rgb_img.save(self.string_path)
        adobe_rgb_img.show()

        srgb_img = self.IM.convert_to_sRGB(adobe_rgb_img)
        srgb_img.show()

        # Convert the image to OpenCV format
        opencv_image_converted = cv2.cvtColor(np.array(srgb_img), cv2.COLOR_RGB2BGR)
        opencv_image_opened = cv2.imread(self.string_path)

        icc_profile1 = self.IM.get_image_profile(adobe_rgb_img, description_only = True)
        cv2.imshow("opencv_opened profile: " + icc_profile1, opencv_image_opened)

        icc_profile2 = self.IM.get_image_profile(srgb_img, description_only = True)
        cv2.imshow("opencv_converted profile: " + icc_profile2, opencv_image_converted)
        
        cv2.waitKey(0)



    def create_temp_images(self, analyse = False, extension = "PNG"):

        self.string_path = self.temp_folder + "/image." + extension
        self.copy_path = self.temp_folder + "/copy." + extension

        pil_img = Image.open(self.file.stream)
        
        if('A' in pil_img.mode):
            pil_img = pil_img.convert('RGB')

        pil_img.save(self.string_path)

        opencv_img = cv2.imread(self.string_path)
        cv2.imwrite(self.copy_path, opencv_img)

        if analyse:
            self.compare_images()

    def compare_images(self):

        # Load the two images
        self.img1 = Image.open(self.string_path)
        
        self.img2 = Image.open(self.copy_path)

        # self.img1.show()
        # self.img2.show()

        print("")
        print("")

        self.compare_profile()
        self.compare_gamma()
        self.compare_white_balance()
        self.compare_contrast()
        self.compare_bands()
        self.compare_structural_similarity()
        self.compare_colors()

        print("")
        print("")


    def compare_profile(self):
        icc_profile1 = self.IM.get_image_profile(self.img1, description_only = True)
        icc_profile2 = self.IM.get_image_profile(self.img2, description_only = True)

        if icc_profile1 == icc_profile2:
            print("both images use the same icc profile")
        else:
            print("the images use a different icc profile")
            print("Profile 1: ", icc_profile1)
            print("Profile 2: ", icc_profile2)
            print()


    def calculate_gamma(self, image):
        # Normalize image
        normalized_image = ImageOps.autocontrast(image)

        # Calculate average pixel value
        pixel_sum = 0
        for pixel in normalized_image.getdata():
            pixel_sum += pixel[0]
        average_pixel_value = pixel_sum / (normalized_image.width * normalized_image.height)

        # Calculate gamma
        gamma = (average_pixel_value / 255) ** 2.2

        return gamma

    def compare_gamma(self):
        # Calculate gamma for two images
        gamma_1 = self.calculate_gamma(self.img1)
        gamma_2 = self.calculate_gamma(self.img2)

        # Compare gamma values
        if gamma_1 == gamma_2:
            print("The gamma values are the same.")
        else:
            print("The gamma values are different.")


    def calculate_white_balance(self, image):
        # Calculate mean and standard deviation of RGB channels
        red, green, blue = image.split()
        red_stats = ImageStat.Stat(red)
        green_stats = ImageStat.Stat(green)
        blue_stats = ImageStat.Stat(blue)

        # Calculate white balance as a tuple of mean and standard deviation for each channel
        white_balance = (red_stats.mean[0], green_stats.mean[0], blue_stats.mean[0], 
                        red_stats.stddev[0], green_stats.stddev[0], blue_stats.stddev[0])

        return white_balance

    def compare_white_balance(self):
        # Calculate white balance for two images
        white_balance_1 = self.calculate_white_balance(self.img1)
        white_balance_2 = self.calculate_white_balance(self.img2)

        # Compare white balance values
        if white_balance_1 == white_balance_2:
            print("The white balance values are the same.")
        else:
            print("The white balance values are different.")


    def get_compression_format(self, image):
        # Get file format
        file_format = image.format

        # Check if format uses compression
        compression_formats = ['JPEG', 'MPO', 'PNG']
        if file_format in compression_formats:
            return file_format
        else:
            return "Uncompressed"

    def compare_compression_level(self):
        # Get compression format for two images
        compression_format_1 = self.get_compression_format(self.img1)
        compression_format_2 = self.get_compression_format(self.img2)

        # Compare compression formats
        if compression_format_1 == compression_format_2:
            print("The images have the same compression format.")
        else:
            print("The images have different compression formats.")


    def compare_contrast(self):
        # Calculate the mean brightness of each image
        mean1 = ImageStat.Stat(self.img1).mean[0]
        mean2 = ImageStat.Stat(self.img2).mean[0]

        # Calculate the contrast difference between the two images
        contrast_diff = abs(mean1 - mean2)

        # Print the contrast difference
        print("Contrast difference:", contrast_diff)

    def compare_bands(self):
        # Get the bands of the image
        bands1 = self.img1.getbands()
        bands2 = self.img2.getbands()

        # Print the bands
        print("img1 bands", bands1)
        print("img2 bands", bands2)

    def compare_structural_similarity(self):
        # Load images
        image1 = sio.imread(self.string_path)
        image2 = sio.imread(self.copy_path)

        # Convert images to grayscale
        gray_img1 = rgb2gray(image1)
        gray_img2 = rgb2gray(image2)

        # Calculate structural similarity
        similarity = ssim(gray_img1, gray_img2, gaussian_weights=True)

        print(f"The structural similarity is: {similarity:.4f}")

    def compare_colors(self):
        # Resize the images to have the same size
        image1 = self.img1.resize(self.img2.size)
        image2 = self.img2

        # Get the pixels of the two images
        pixels1 = image1.load()
        pixels2 = image2.load()

        # Create a new image to store the differences
        diff_img = Image.new(image1.mode, image1.size)
        diff_pixels = diff_img.load()

        color_difference = False
        # Loop through all the pixels of the images
        for i in range(image1.size[0]):
            for j in range(image1.size[1]):
                # Get the RGB values of the pixels
                r1, g1, b1 = pixels1[i, j]
                r2, g2, b2 = pixels2[i, j]
                
                # Calculate the difference between the RGB values
                diff_r = abs(r1 - r2)
                diff_g = abs(g1 - g2)
                diff_b = abs(b1 - b2)
                
                # Set the pixel in the difference image to the difference in color
                diff_pixels[i, j] = (diff_r, diff_g, diff_b)

                if color_difference == False and (diff_r > 0 or diff_g > 0 or diff_b > 0):
                    color_difference = True

        if color_difference:
            print(f"The color values contain a different")
            # Display the output image
            diff_img.show()
        else:
            print(f"The color values are the same")

