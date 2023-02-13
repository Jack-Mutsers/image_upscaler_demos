details = document.getElementById("pyscript-operation-details");

var updating = false;

details.addEventListener("DOMNodeInserted", function(){
    if(updating == false){
        updating = true;

        log = details.getElementsByTagName("p");
        
        last_item = log.item(log.length - 1);
        
        details.innerHTML = "";
        details.append(last_item);

        updating = false;
    }
});

function set_message(message){
    item = document.createElement("p");
    item.innerHTML = message;

    updating = true;

    details.innerHTML = "";
    details.append(item)

    updating = false;
}