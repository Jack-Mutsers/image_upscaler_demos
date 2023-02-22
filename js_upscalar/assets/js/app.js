
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
var conversion_table;
var compare_container;
var compare = false;

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
  conversion_table = document.getElementById("convertsion_table")
  compare_container = document.getElementById("image-compare")

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

  const element = document.getElementById("image-compare");
  const viewer = new ImageCompare(element).mount();
}

function resend_image(){
  if(file.value == null || file.value == undefined || file.value == "" || file.value == false){
      console.log("no image selected")
      file.click();
      return;
  }

  console.log("resend_image");

  if ("createEvent" in document) {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent("change", false, true);
      file.dispatchEvent(evt);
  }
  else
      file.fireEvent("onchange");
}

function create_table_row(original_id, target_id){
    const tr = document.createElement("tr");

    const td_original = document.createElement("td");
    td_original.setAttribute("id", original_id)
    tr.append(td_original);
    
    const td_target = document.createElement("td");
    td_target.setAttribute("id", target_id)
    tr.append(td_target);

    conversion_table.append(tr);
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

const createImage = (target_id, src) => {
  targetDiv = document.getElementById(target_id);
    
    var img;
    if(compare){  
        img_id = target_id == "original_0" ? "img_original" : "img_target"

        img = document.getElementById(img_id);
        img.src = src;
    }else{
        targetDiv.innerHTML = "";

        img = document.createElement("img");
        img.src = src;
      
        targetDiv.appendChild(img);
    }
    return img;
};
  
function create_log_message(message){
  const paragraph = document.createElement("p");
  paragraph.innerHTML = message;
  info.append(paragraph);
}

async function handleFiles() {
  if(this.value == null || this.value == undefined || this.value == false || this.value == ""){
    return;
  }

  compare = this.files.length == 1;

  info.innerHTML = "";

  if(compare){
      compare_container.style = "";
  }else{
      conversion_table.innerHTML = "";
      conversion_table.style = "";
  }

  await set_model();

  for(i = 0; i < this.files.length; i++){
    const file = this.files[i]
    
    if(file.type.includes("image") == false){
        message = "invalid filetype detected for file: <b>\"" + file.name + "\"</b> of type: <b>\"" + file.type + "\"</b>";
        create_log_message(message)
        continue;
    }

    const original_id = "original_" + i;
    const target_id = "target_" + i;

    if(compare == false){
        create_table_row(original_id, target_id);
    }

    create_log_message("Upscaling...");

    await tf.nextFrame();
    const fr = new FileReader();
    fr.onload = async () => {
      const img = createImage(original_id, fr.result);
      const start = new Date().getTime();
      const upscaledImgSrc = await upscaler.upscale(img, {
        patchSize: 64,
        padding: 5,
      });
      createImage(target_id, upscaledImgSrc);
      const ms = new Date().getTime() - start;
      info.innerText = `Upscaled in ${ms} ms`;

      this.value = "";
    };
    fr.readAsDataURL(file);
  }
}