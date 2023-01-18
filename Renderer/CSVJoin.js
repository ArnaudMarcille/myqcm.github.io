window.onload = function () {
    document.getElementById('btn-send_File').addEventListener('click', LoadFile);
}

function LoadFile() {
    ClearLogs();
    var input = document.getElementById("in-FileSelector");
    if (input == undefined && input.files.length < 1) {
        return;
    }

    InsertLog(input.files.length + (input.files.length > 1? ' files' : ' file') + ' loaded...');
    let promises = [];
    for (let file of input.files) {
        InsertLog('Loading file ' + file.name + '...');
        let filePromise = new Promise(resolve => {
            let reader = new FileReader();
            reader.addEventListener('load', e => resolve(ReadFile(e)));
            reader.readAsBinaryString(file);
        });
        promises.push(filePromise);
    }
    Promise.all(promises).then(filesContents => {
        console.log(filesContents);
        // Generate string content

        // joind all rows in one string
        let finalFile = "Question; Reponses (en numero, separes par des espaces); Explication; Reponses, autant que necessaire;;;\r\n";//rows.join('\r\n')

        // _FilesContents rows
        let rows = [];
        for(let row of filesContents){
            rows = rows.concat(row);
        }

        InsertLog('Total question count : ' + rows.length);
        finalFile = finalFile.concat(rows.join('\r\n'));
        
        console.log(rows.join('\r\n'));
        // Get file name
        let fileName = document.getElementById("in-FinalFileName").value;
        if (!fileName) {
            fileName = "JoinedFile";
        }
        fileName = fileName.replace('\\', '-');
        fileName = fileName.replace('/', '-');

        // download file
        InsertLog("Creating file " + fileName + '.csv...');

        let a = document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([finalFile], { type: "text/plain" }));
        a.download = fileName + ".csv";
        a.click();
        InsertLog("File join finished.");

    });
}

/**
 * Manage file in UTF8
 * @param bytes 
 * @returns 
 */
function readUTF8String(bytes) {
    var ix = 0;

    if (bytes.slice(0, 3) == "\xEF\xBB\xBF") {
        ix = 3;
    }

    var string = "";
    for (; ix < bytes.length; ix++) {
        var byte1 = bytes[ix].charCodeAt(0);
        if (byte1 < 0x80) {
            string += String.fromCharCode(byte1);
        } else if (byte1 >= 0xC2 && byte1 < 0xE0) {
            var byte2 = bytes[++ix].charCodeAt(0);
            string += String.fromCharCode(((byte1 & 0x1F) << 6) + (byte2 & 0x3F));
        } else if (byte1 >= 0xE0 && byte1 < 0xF0) {
            var byte2 = bytes[++ix].charCodeAt(0);
            var byte3 = bytes[++ix].charCodeAt(0);
            string += String.fromCharCode(((byte1 & 0xFF) << 12) + ((byte2 & 0x3F) << 6) + (byte3 & 0x3F));
        } else if (byte1 >= 0xF0 && byte1 < 0xF5) {
            var byte2 = bytes[++ix].charCodeAt(0);
            var byte3 = bytes[++ix].charCodeAt(0);
            var byte4 = bytes[++ix].charCodeAt(0);
            var codepoint = ((byte1 & 0x07) << 18) + ((byte2 & 0x3F) << 12) + ((byte3 & 0x3F) << 6) + (byte4 & 0x3F);
            codepoint -= 0x10000;
            string += String.fromCharCode(
                (codepoint >> 10) + 0xD800, (codepoint & 0x3FF) + 0xDC00
            );
        }
    }

    return string;
}

/**
 * Read file documents
 * @param e File
 * @returns 
 */
function ReadFile(e) {
    var textContent = readUTF8String(e.target.result);
    let rows = textContent.split('\r\n');
    let fileContent = [];

    for (let i = 1; i < rows.length; i++) {
        if (rows[i] != '' && rows[i].split(';').length > 4) {
            fileContent.push(rows[i]);
        }
    }

    return fileContent;
}

function InsertLog(trace){
    var logContent = document.getElementById("Logs_Content");
    logContent.innerHTML = (logContent.innerHTML != '' ? logContent.innerHTML +  '<br />' + trace : trace);
}

function ClearLogs(){
    var logContent = document.getElementById("Logs_Content");
    logContent.innerHTML = '';
}