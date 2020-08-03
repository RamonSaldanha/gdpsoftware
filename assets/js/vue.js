const { dialog, Menu, shell } = require('electron').remote
var slugify = require('slugify')


var vm = new Vue({
  el: "#app",
  data: {
    search: '',
    models:[],
    modelName: '',
    modelStateFields: false, // false indica que não tem modelos de campos personalizados
    selected: false,
    documentsFolder: '',
    modelsFolder: '',
    inputModel: {
      document: "",
      lists: []
    }
  },
  mounted: function(){
    var vm = this 
    
  },
  created: function(){
    const fs = require('fs');
    const path = require('path');
    const isDev = require('electron-is-dev');
    
    if (isDev) {
      var modelProperties = path.join(__dirname, "propriedades_de_modelos.txt");
    } else {
      var modelProperties = path.join(process.resourcesPath, "propriedades_de_modelos.txt");
    }
    
    if (!fs.existsSync( modelProperties )){
      
      fs.writeFile(modelProperties, '[]', function (err) {
        if (err) throw err;
      });
    }  
  },
  updated: function () {
    let vm = this;
    const fs = require('fs');

  
    $('[data-toggle="tooltip"]').tooltip();
  },
  watch: {
    modelName: function(oldModelName){
      var vm = this;
      
      fs.readFile(localStorage.getItem('modelsFolder') + platformFileWay() + fileNameDataDefault, 'utf8', function(err, data) {
        var inputModel = JSON.parse(data);
        // console.log(slugify(oldModelName))
        var model = inputModel.find( model => model.document === slugify(oldModelName));
        if(model){
          // console.log("tem modelo")
          vm.inputModel = model;
          vm.modelStateFields = true;
        } else {
          // console.log("não tem modelo")
          vm.modelStateFields = false;
          vm.inputModel = inputModel.find( model => model.document === "default");
        }
      });

    },
  },
  computed: {
    filteredModels() {     

      return this.models.filter(model => {
        return model.model_name.toLowerCase().includes(this.search.toLowerCase())
      }).sort((a) => a.fixed ? -1 : 1)
    },
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      };
    }
  },
  methods: {
    fixModelToggle(modelName) {
      var modelProperties = "propriedades_de_modelos.txt";

      var modelPropertiesPath = localStorage.getItem('rootFolder') + platformFileWay() + modelProperties;
      var vm = this;

      if (!fs.existsSync( modelPropertiesPath )){
        fs.writeFile(modelPropertiesPath, '[]', function (err) {
          if (err) throw err;
        });
      }

      fs.readFile(modelPropertiesPath, 'utf8', function(err, data) {
        var properties = JSON.parse(data);
        var modelo = properties.find( propriedades => propriedades.model_name === modelName);
        var title;
        
        if( modelo ) {

          properties.splice(properties.indexOf(modelo), 1);  

          if( modelo.fixed ) {
            var modelObject = {"model_name": modelName, "fixed": false };
            properties.push(modelObject);
            title = "Seu modelo foi desfixado!";

            // var model = vm.models.find( model => model.model_name === modelName);
            // var index = vm.models.indexOf(model);
            // vm.$set(vm.models, index, modelObject)


          } else {
            var modelObject = {"model_name": modelName, "fixed": true }
            properties.push(modelObject);
            title = "Seu modelo foi fixado!";

            // var model = vm.models.find( model => model.model_name === modelName);
            // var index = vm.models.indexOf(model);
            // console.log(index)
            // vm.$set(vm.models, index, modelObject)

          }

          fs.writeFile(modelPropertiesPath,  JSON.stringify(properties), function (err) {
            if (err) return console.log(err);
            
            var model = vm.models.find( model => model.model_name === modelName);
            var index = vm.models.indexOf(model);
            vm.$set(vm.models, index, modelObject)

            const toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: true,
              timer: 4000,
              timerProgressBar: true,
            })
            // console.log("Já está nas propriedades")
            toast.fire({
              type: 'success',
              title: title
            })
  
          });
        } else {
          
          // console.log("Não está no arquivo propriedades.txt")

          properties.push({"model_name": modelName, "fixed": true });
          title = "Seu modelo foi fixado!";


          var model = vm.models.find( model => model.model_name === modelName);
          var index = vm.models.indexOf(model);
          vm.$set(vm.models, index, {"model_name": modelName, "fixed": true })

          fs.writeFile(modelPropertiesPath,  JSON.stringify(properties), function (err) {
            if (err) return console.log(err);
            
            const toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: true,
              timer: 4000,
              timerProgressBar: true,
            })
      
            toast.fire({
              type: 'success',
              title: title
            })
  
          });
        }
      });
    },
    openBrowserLink(url) {
      shell.openExternal(url);
    },
    openFile(filename){
      shell.openExternal(`file://${this.modelsFolder}${platformFileWay()}${filename}`)
    },
    saveDefaultInputsModel(){

      //OK 

      this.inputModel["document"] = "default";
      fs.readFile(localStorage.getItem('modelsFolder')  + platformFileWay() + fileNameDataDefault, 'utf8', function(err, data) {
        var models = JSON.parse(data);
        var padrao = models.find( padrao => padrao.document === "default");
        models.splice(models.indexOf(padrao), 1);
        models.push(vm.inputModel);
        fs.writeFile(localStorage.getItem('modelsFolder')  + platformFileWay() + fileNameDataDefault,  JSON.stringify(models), function (err) {
          if (err) return console.log(err);
          
          const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: true,
            timer: 4000,
            timerProgressBar: true,
          })
    
          toast.fire({
            type: 'success',
            title: 'Seu modelo de campos padronizado foi salvo!'
          })

        });
      });
    },
    saveCustomInputsModel() {
      
      var vm = this
      vm.inputModel["document"] = slugify(vm.modelName);
      fs.readFile(localStorage.getItem('modelsFolder')  + platformFileWay() + fileNameDataDefault, 'utf8', function(err, data) {
        
        var models = JSON.parse(data);
        var model = models.find( model => model.document === slugify(vm.modelName));
        if(model) {
          // já existe modelo precisa deletar antes.
          models.splice(models.indexOf(model), 1)
          models.push(vm.inputModel);
        } else {
          models.push(vm.inputModel);
        }
        fs.writeFile(localStorage.getItem('modelsFolder')  + platformFileWay() + fileNameDataDefault,  JSON.stringify(models), function (err) {
          if (err) return console.log(err);

          const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: true,
            timer: 4000,
            timerProgressBar: true,
          })
          
          vm.modelStateFields = true;

          toast.fire({
            type: 'success',
            title: 'Seu modelo de campos foi salvo!'
          })
    
        });

      });

    },
    addInput(listId){
      var list = this.inputModel.lists.find( list => list.id === listId)['inputs'];
      list.push({ name: "Novo Campo"});
    },
    addList() {
      this.inputModel.lists.push({ name: "Nova lista", id: Math.floor(Math.random() * 1000), inputs: []  });
    },
    removeInput(listId, inputId){
      var list = this.inputModel.lists.find( list => list.id === listId)['inputs'];
      list.splice(inputId, 1)
    },
    saveConfigs() {

      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: true,
        timer: 4500
      })

      toast.fire({
        type: 'success',
        title: 'Configurações Salvas'
      })

      localStorage.setItem('documentsFolder', this.documentsFolder);
      localStorage.setItem('modelsFolder', this.modelsFolder);
      
      updateModels ();
  
    },
    changeModelsFolder() {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(result => {
        if(!result.canceled) {
          vm.modelsFolder = result.filePaths[0]
        }
      })
    },
    changeDocumentsFolder() {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(result => {
        if(!result.canceled) {
          vm.documentsFolder = result.filePaths[0]
        }
      })
    }
  }
});