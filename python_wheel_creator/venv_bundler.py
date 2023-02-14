#!/usr/bin/env python
"""
Bundle the site-packages of the current python environment into a zip file
If you have any wheels at `$(pwd)/wheels`, those will be used instead of
of the locally installed packages. For instance, if my pwd looked like
wheels/
|-- numpy-1.11.2-cp27-cp27mu-manylinux1_x86_64.whl
the `numpy` package installed in my venv would be ignored, and this
wheel would be unzipped in its place. This allows you to e.g. develop
on OSX while bundling a venv for deployment on Linux using manylinux wheels.
"""
from distutils.sysconfig import get_python_lib
import glob
import os
import shutil
import zipfile
import uuid


def skip_wheel(path, wheels):
    for package in wheels.keys():
        if path.startswith(package):
            return True
    return False


def zip_env(path, ziph, wheels=None):
    if not wheels:
        wheels = {}
    for root, _, files in os.walk(path):
        for file in files:
            abs_path = os.path.join(root, file)
            rel_path = os.path.relpath(os.path.join(root, file), path)
            if not skip_wheel(rel_path, wheels):
                ziph.write(abs_path, rel_path)


if __name__ == "__main__":
    site_packages = get_python_lib()

    # Find wheels in `wheels` dir
    wheels = {os.path.basename(w).split('-')[0]: w
              for w in glob.glob("wheels/*.whl")}

    with zipfile.ZipFile('dist.zip', 'w', zipfile.ZIP_DEFLATED) as dst:
        print("Bundling site-packages...")
        zip_env(site_packages, dst, wheels)

        for package, wheel in wheels.items():
            print("Bundling {} wheel...".format(package))

            # extract to tempdir
            dirn = "/tmp/{0}-{1}".format(package, uuid.uuid4())
            os.makedirs(dirn)
            zipfile.ZipFile(wheel).extractall(dirn)

            # Put contents in zip
            zip_env(dirn, dst)

            # cleanup
            shutil.rmtree(dirn)