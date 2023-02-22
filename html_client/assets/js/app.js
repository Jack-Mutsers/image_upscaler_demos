var table;
var original;
var target;
var file;
var info;
var conversion_table;
var compare_container;
var compare = false;

function setup(){
    table = document.getElementById("table");
    original = document.getElementById("original");
    target = document.getElementById("target");
    file = document.getElementById("file");
    info = document.getElementById("info");
    conversion_table = document.getElementById("convertsion_table")
    compare_container = document.getElementById("image-compare")
  
    file.addEventListener("change", handleFiles, false);

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

        const fr = new FileReader();
        fr.onload = async () => {
            createImage(original_id, fr.result);
            const start = new Date().getTime();
            const upscaledImgSrc = await handleImageUpload(file);

            if(upscaledImgSrc !== false){
                createImage(target_id, upscaledImgSrc);
                const ms = new Date().getTime() - start;
                create_log_message(`Upscaled in ${ms} ms`);
            
                this.value = "";
            }
        };

        fr.readAsDataURL(file);
    }

}


const base_url = "http://127.0.0.1:5000";

const handleImageUpload = async (file) => {
    
    var formdata = new FormData();
    formdata.append('file', file)
    
    var requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow',
      mode: 'cors',
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    return await fetch(base_url+"/api/upscale", requestOptions)
        .then(response => {
            if(response.status != 200){
                return false;
            }

            return response.json();
        })
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log('error', error);
            return false;
        });
}