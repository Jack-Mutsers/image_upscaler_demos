 # Base image
FROM python_webserver_dependencies

# Set working directory
WORKDIR /app

# Copy app source code
COPY . .

# Expose the port that the app will run on
EXPOSE 8000

# Start the app
CMD ["python", "image_controler.py"]
