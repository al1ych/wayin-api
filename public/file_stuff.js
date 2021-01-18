// UPLOAD

let dropArea = document.getElementById('drop-area');
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName =>
{
    dropArea.addEventListener(eventName, preventDefaults, false);
});

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e)
{
    let dt = e.dataTransfer;
    let files = dt.files;
    let f = files[0];
    let fr = new FileReader();
    fr.onload = () =>
    {
        geom2map(fr.result);
    };
    draw_svg(); // draw orig svg?
    fr.readAsText(f);

}

function preventDefaults(e)
{
    e.preventDefault();
    e.stopPropagation();
}


// file
inputfile.addEventListener('change', function ()
{
    var fr = new FileReader();
    fr.onload = function ()
    {
        geom2map(fr.result);
    };

    fr.readAsText(this.files[0]);
});

var ctx;
window.onload = function ()
{
    ctx = ca.getContext("2d");
};


// download
function download_json(o, file_name)
{
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    var json = JSON.stringify(o),
        blob = new Blob([json], {type: "octet/stream"}),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = file_name;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}