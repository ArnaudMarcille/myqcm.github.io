const { ipcRenderer } = require('electron');
var path = require('path');

const valueTemplate ='<a href="./QCM.html?Path=#=Path#&Name=#=Name#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center FileSelector"> #=FileName# <span class="badge bg-primary rounded-pill">#=Start#</span></a>'

let labels;

window.onload = function () {
    document.getElementById('FolderPicker').addEventListener("click", openFile);

    ipcRenderer.send('GetLabels');
    ipcRenderer.send('HaveSelectedFolder');
}

function openFile() {
    ipcRenderer.send('openFolder')
}

ipcRenderer.on('GetLabelsResponse', (event, data) => {
    labels = data
})

ipcRenderer.on('folderData', (event, data) => {
    var input = document.getElementById("Path");
    input.value = data.path;
    console.log(data);
    let list = document.getElementById('list');
    list.innerHTML = "";
    for (let i = 0; i < data.files.length; i++) {
        let file = data.files[i];
        
        let content = valueTemplate;
        content = content.replace('#=FileName#', file);
        content = content.replace('#=Path#', encodeURIComponent(path.join(data.path, file)));
        content = content.replace('#=Name#', encodeURIComponent(file.replace('.csv', '')));
        content = content.replace('#=Start#', labels['Home-Btn_SelectFile']);

        list.innerHTML += content
    }
})