
image_path = "assets/images/baboon-original.png";
models = {
  "esrgan_slim": {
    x2: {
      path: "/assets/models/esrgan-slim/2x/model.json",
      scale: 2
    },
    x3: {
      path: "/assets/models/esrgan-slim/3x/model.json",
      scale: 3
    },
    x4: {
      path: "/assets/models/esrgan-slim/4x/model.json",
      scale: 4
    }
  },
  "esrgan_medium": {
    x2: {
      path: "/assets/models/esrgan-medium/2x/model.json",
      scale: 2
    },
    x3: {
      path: "/assets/models/esrgan-medium/3x/model.json",
      scale: 3
    },
    x4: {
      path: "/assets/models/esrgan-medium/4x/model.json",
      scale: 4
    }
  }
};

var table;
var original;
var target;
var file;
var info;
var model_selector;
var model_scale_selector;

var upscaler;

async function set_model(){
  model_name = model_selector.value;
  scale = model_scale_selector.value;

  upscaler = new Upscaler({
    // model: DefaultUpscalerJSModel,
    model: models[model_name][scale]
  })
}

function setup(){
  table = document.getElementById("table");
  original = document.getElementById("original");
  target = document.getElementById("target");
  file = document.getElementById("file");
  info = document.getElementById("info");

  model_selector = document.getElementById("model_selector");
  model_scale_selector = document.getElementById("model_scale_selector");
  
  for (const model in models) {
    new_input = document.createElement("option");
    new_input.value = model;
    new_input.innerHTML = model;

    model_selector.appendChild(new_input);
  }

  set_scale_selectbox();

  file.addEventListener("change", handleFiles, false);
  model_selector.addEventListener("change", set_scale_selectbox, false);
}

function set_scale_selectbox(){
  model = model_selector.value;

  old_selection = model_scale_selector.value;
  
  model_scale_selector.innerHTML = "";
  for (const scale in models[model]) {
    new_input = document.createElement("option");
    new_input.value = scale;
    new_input.innerHTML = scale;

    if(scale == old_selection){
      new_input.setAttribute("selected", true);
    }

    model_scale_selector.appendChild(new_input);
  }
}

const createImage = (targetDiv, src, upscaled = false) => {
  const img = document.createElement("img");
  img.src = src;
  targetDiv.innerHTML = "";

  if(upscaled){
    original_img = original.getElementsByTagName("img")[0]
  }

  targetDiv.appendChild(img);
  return img;
};

async function handleFiles() {
  if(this.value == null || this.value == undefined || this.value == false || this.value == ""){
    return;
  }

  await set_model();

  info.innerText = "Upscaling...";
  target.innerHTML = "";
  table.style = "";
  await tf.nextFrame();
  const file = this.files[0];
  const fr = new FileReader();
  fr.onload = async () => {
    const img = createImage(original, fr.result);
    const start = new Date().getTime();
    const upscaledImgSrc = await upscaler.upscale(img, {
      patchSize: 64,
      padding: 5,
    });
    createImage(target, upscaledImgSrc, true);
    const ms = new Date().getTime() - start;
    info.innerText = `Upscaled in ${ms} ms`;

    this.value = "";
  };
  fr.readAsDataURL(file);
}