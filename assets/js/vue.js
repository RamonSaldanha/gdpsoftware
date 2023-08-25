const { dialog, Menu, shell } = require('electron').remote
var slugify = require('slugify');
const mammoth = require("mammoth");


var Home = Vue.component('home',{
  template: `
  <div class="p-4 d-flex flex-column justify-content-center">
    <img src="assets/img/ilustração.png" class="img-fluid">
    <h4 class="d-block mt-4 text-muted text-center">
      Ficou mais fácil lidar com demandas repetitivas. <br /> <br />
      Tenha um ótimo dia de trabalho!🌻
    </h4>
  </div>

  `
});

var Login = Vue.component('login', {
  template: `
  <div>
    <router-link to="/" class="btn btn-sm mt-2">
      <i class="fas fa-arrow-left"></i>
    </router-link>
    <div class="row">
      <div class="col-12 pr-4">
        <h4 class="d-block mt-4 text-muted text-center">
          Faça login para compartilhar e baixar novos modelos da comunidade.
        </h4>
        <form>
          <div class="form-group">
            <label for="exampleInputEmail1">E-mail</label>
            <input type="email" class="form-control" id="exampleInputEmail1" v-model="formLogin.email" placeholder="Digite seu e-mail">
            {{ formLogin.email }}
          </div>
          <div class="form-group">
            <label for="exampleInputPassword1">Senha</label>
            <input type="password" class="form-control" id="exampleInputPassword1" v-model="formLogin.password" placeholder="Digite sua senha">
            {{ formLogin.password }}
          </div>
          <button type="submit" class="btn btn-primary">Entrar</button>
        </form>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      formLogin: {
        email: '',
        password: ''
      },
    }
  },
});


const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
  { path: '/profile', name: 'profile', meta: { auth: true }, component: Login },
  // criar rota com um parametro dinamico
  { path: '/ia-generator/:modelo', name: 'ia-generator', component: window.IaGenerator },

  // { path: '/ia-generator/:modelo', name: 'ia-generator', component: window.IaGenerator },
]

const router = new VueRouter({
  routes // short for `routes: routes`
})

router.beforeEach((to, from, next) => {
  if(to.meta.auth) {
    next({
      path: '/login'
    })
  }
  next()
})

Vue.use(VueQuillEditor)

var vm = new Vue({
  router,
  el: "#app",
  data: {
    newModelContent: "",
    totalFields: 0,
    filledFields: 0,
    filledPercent: 0,
    search: '',
    models:[],
    modelName: '',
    modelStateFields: false, // false indica que não tem modelos de campos personalizados
    selected: false,
    documentsFolder: '',
    modelsFolder: '',
    loading: false,
    apiKey: '',
    docxInHtml: '',
    inputModel: {
      document: "",
      lists: []
    },
    rightSide: false,
    content: ''
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
    /* ao selecionar um modelo ele irá = */
    modelName: function(oldModelName){
      var vm = this;

      // Ativar menu lateral
      vm.rightSide = true;

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

      mammoth.convertToHtml({path: `${localStorage.getItem('modelsFolder')}${platformFileWay()}${oldModelName}`})
        .then(function(result){
          document.getElementById("docxviewer").innerHTML = result.value

          // contar campos carregados assim que o documento for impresso
          const form = document.getElementById('fast-form')
          var fields = form.querySelectorAll('.form-control')
          vm.filledFields = 0;

          for(i = 0; i < fields.length; i++){
            if( fields[i].value ) {
              vm.filledFields++
            }
          }

          form.addEventListener("blur", function( event ) {
            vm.filledFields = 0;
            for(i = 0; i < fields.length; i++){
              if( fields[i].value ) {
                vm.filledFields++
                vm.filledPercent = vm.calculatePercentage()
              }
            }
          }, true);
          vm.totalFields = fields.length;

        })
        .done();

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
    removeList (listId) {
      Swal.fire({
        title: 'Você tem certeza?',
        text: "Fazendo isso você vai deletar toda lista.",
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Sim. Deletar!'
      }).then((result) => {
        if (result.value) {
          var listPosition = this.inputModel.lists.indexOf(this.inputModel.lists.find( list => list.id === listId))
          this.inputModel.lists.splice(listPosition, 1)
        }
      })
    },
    calculatePercentage() {
      return parseFloat(vm.filledFields / vm.totalFields * 100).toFixed(0)
    },
    closeModalRight ( ) {
      var vm = this;
      vm.rightSide = false;
    },

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
      localStorage.setItem('apiKey', this.apiKey);
      
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