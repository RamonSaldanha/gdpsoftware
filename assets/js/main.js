const $ = require('jquery')
const Bootstrap = require('bootstrap');
const tooltip = require('popper.js');
var fs = require('fs');
var path = require('path');
var slugify = require('slugify')

/* assistir alterações na pasta para atualizar as opções de modelo */

var documents = [];

var fileNameDataDefault = "padrao_de_campos.txt";

var documentsFolder = localStorage.getItem('documentsFolder');
var modelsFolder = localStorage.getItem('modelsFolder');
var rootFolder = localStorage.getItem('rootFolder');

document.onkeyup = function(e) {
  if (e.which == 39) {
    // vm.selected = true;
  } else if (e.which == 37) {
    // vm.selected = false
  } else if (e.ctrlKey && e.which == 83 ) {
    $("#generate-model").submit();
  }
};

function fromDir(startPath,filter){
  
  // console.log('Starting from dir '+startPath+'/');
  if (!fs.existsSync( startPath )){
    console.log("no dir ", startPath);
    return;
  }
  
  var files = fs.readdirSync( startPath ) ;
  var modelProperties = "propriedades_de_modelos.txt";

  var modelPropertiesPath = localStorage.getItem('rootFolder') + "\\" + modelProperties;
  
  var properties = JSON.parse(fs.readFileSync(modelPropertiesPath, 'utf8'));
  var modelsWithFixedField = [];

  for(var i=0; i<files.length; i++){

    var filename = startPath + '/' + files[i];

    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()){
      fromDir(filename,filter); //recurse
    }
    else if (filename.indexOf(filter)>=0) {
      // console.log('-- found: ',filename);
      /* colocar propriedade fixed dentro do model puro só com o nome do documento */
      var modelProperty = properties.find( propriedades => propriedades.model_name === files[i]);
      if( modelProperty ) {
        documents.push({
          "model_name": files[i],
          "fixed": modelProperty.fixed
        })
      } else {
        documents.push({
          "model_name": files[i],
          "fixed": false
        })
      }
    };
  };
};

/* será usado para remover o .docx do nome do modelo */
function remove_character(str_to_remove, str) {
  let reg = new RegExp(str_to_remove)
  return str.replace(reg, '')
}

function isDev() {
  return process.mainModule.filename.indexOf('app.asar') === -1;
}

function folderWay(folderOrFile) {
  if(isDev()){
    return path.join(__dirname, folderOrFile);
  } else {
    // console.log( path.join(process.resourcesPath, folderOrFile))
    return path.join(process.resourcesPath, folderOrFile);
  }
}

function updateModels ( ) {

  verifyIfExistsData()

  documents = [];

  fromDir( vm.modelsFolder, '.docx')
  vm.models = documents;
}


function verifyIfExistsData() {

  var fileDataPath = localStorage.getItem('modelsFolder') + "\\" + fileNameDataDefault;
  // console.log(fileDataPath)
  if (!fs.existsSync( fileDataPath )){
    fs.appendFile(fileDataPath, '[{"document":"default","lists":[{"name":"Nova lista","id":394,"inputs":[{"name":"Novo Campo"}]}]}]', function (err) {
      if (err) throw err;
    });
    return;
  }

}

vm.documentsFolder = ( documentsFolder ) ? documentsFolder : folderWay('/documentos');
vm.modelsFolder = ( modelsFolder ) ? modelsFolder : folderWay('/modelos');
vm.rootFolder = ( rootFolder ) ? rootFolder : folderWay('/');

localStorage.setItem('documentsFolder', vm.documentsFolder);
localStorage.setItem('modelsFolder', vm.modelsFolder);
localStorage.setItem('rootFolder', vm.rootFolder);

 
// var modelProperties = folderWay('/propriedades_de_modelos.txt');

// if (!fs.existsSync( modelProperties )){
//   fs.writeFile(modelProperties, '[]', function (err) {
//     if (err) throw err;
//   });
// }  

fs.watch(vm.modelsFolder, (eventType, filename) => {
  updateModels ();
});

$(document).ready(function(){

  // reiniciar padrão removendo pastas padrões
  // localStorage.removeItem('documentsFolder');
  // localStorage.removeItem('modelsFolder');

  const documentCreated = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
    confirmButtonText: 'Abrir na pasta de documentos gerados.',
    timer: 10000
  })

  const selectModel = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
    timer: 4500
  })

  updateModels();

  $("#openModels").click(function(){
    const {shell} = require('electron');
    shell.openItem(vm.modelsFolder)
  })

  $("#openDocuments").click(function(){
    const {shell} = require('electron');
    shell.openItem(vm.documentsFolder);
  })

  $("#createNewModel").submit((e)=>{
    e.preventDefault();
    var filename = $("#createNewModel").serializeArray()[0].value + '.docx';
    if (fs.existsSync(`${localStorage.getItem('modelsFolder')}\\${filename}`)) {
      selectModel.fire({
        type: 'error',
        title: 'Já existe um documento com esse nome.'
      })
    } else {
      fs.writeFile(`${localStorage.getItem('modelsFolder')}\\${filename}`, '', function (err) {
        if (err) throw err;
        selectModel.fire({
          type: 'success',
          title: 'O documento foi gerado!',
          confirmButtonText: 'Abrir modelo no editor de texto.',
          preConfirm: () => {
            const {shell} = require('electron');
            shell.openItem((`${localStorage.getItem('modelsFolder')}\\${filename}`));
          }
        })
      });
    }

  });

  $("#generate-model").submit(function(e){
    e.preventDefault();

    var modelName = $("[name='documents']:checked").val();
    var data = { };
    $.each($('#generate-model').serializeArray(), function() {
      data[slugify(this.name)] = this.value;
    });


    // console.log(data)
    
    var PizZip = require('pizzip');
    var Docxtemplater = require('docxtemplater');

    //Load the docx file as a binary
    try {
      // console.log(vm.modelsFolder + "\\" + modelName);
      var content = fs.readFileSync(vm.modelsFolder + "\\" + modelName, 'binary');
    } catch (err) {
      selectModel.fire({
        type: 'error',
        title: 'Não foi possível gerar um documento, selecione um modelo antes!'
      })
    }
    
    var zip = new PizZip(content);
    
    var doc = new Docxtemplater();
    doc.loadZip(zip);
    
    //set the templateVariables
    doc.setData(data);
    
    try {
      // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
      doc.render()
    }
    catch (error) {
      var e = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        properties: error.properties,
      }
      // console.log(JSON.stringify({error: e}));
      // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
      throw error;
    }
    
    var buf = doc.getZip()
    .generate({type: 'nodebuffer'});
    var today = new Date();
    let fileName = `${vm.documentsFolder}\\(${today.getDate()}-${today.getMonth()}-${today.getFullYear()} ${today.getHours()}hrs ${today.getMinutes()}min) ${remove_character('.docx', modelName)}.docx`
    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
    fs.writeFileSync(fileName, buf);

    documentCreated.fire({
      type: 'success',
      title: 'O documento foi gerado!',
      preConfirm: () => {
        const {shell} = require('electron');
        shell.showItemInFolder(fileName)
      }
    })
  })
});