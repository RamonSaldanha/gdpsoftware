const { default: Swal } = require('sweetalert2');

const IaGenerator = {
  template: `
	<div class="route-nav">

		<div class="nav-right-header">
			<div class="d-flex w-100 my-auto">
				<router-link to="/" class="btn btn-sm mt-2">
					<i class="fas fa-arrow-left"></i>
				</router-link>
				<div class="d-flex m-auto pt-2">Gerador com IA</div> 
			</div>
		</div>
		<div class="nav-right-modal">
			<form @submit.prevent="handlePrompt" class="pb-5" id="fast-form">
				<div class="input-content" v-for="inputField in modelo.inputs" :key="inputField.name">
						<div class="options-input rounded">
						{{ inputField.name }}
						<label>
							<input v-if="inputField.type === 'text'" 
							class="form-control"
							:name="inputField.name" 
							:type="inputField.type"
							v-model="formData[inputField.name]">

							<textarea rows="7" v-if="inputField.type === 'textarea'"
								class="form-control"
								:name="inputField.name"
								v-model="formData[inputField.name]"></textarea>

						</label>
					</div>
				</div>
				<button type="submit" class="btn btn-secondary btn-block">Gerar documento <i class="fas fa-download ml-1 text-light"></i></button>
			</form>
		</div>
	</div>
  `,
  data() {
    return {
			loading: false,
      modelos: [
				{ 
					id: 1, 
					nome: 'peticao-inicial', 
					inputs: [
						{ name: 'area-do-direito', type: 'text' },
						{ name: 'caso-concreto', type: 'textarea' },
						{ name: 'natureza-da-acao', type: 'text' },
						{ name: 'objetivos', type: 'text' },
						{ name: 'nome', type: 'text' },
						{ name: 'estado-civil', type: 'text' },
						{ name: 'profissao', type: 'text' },
						{ name: 'cpf', type: 'text' },
						{ name: 'rg', type: 'text' },
						{ name: 'endereco', type: 'textarea' },
						{ name: 'cidade-uf', type: 'text' },
						{ name: 'cep', type: 'text' },
						{ name: 'whatsapp', type: 'text' },
						{ name: 'email', type: 'text' },
					]

				},
				{ id: 1, nome: 'contestacao' },
			],
			formData: {
				// 'area-do-direito': 'Direito do trabalho',
				// 'caso-concreto': 'Trabalhou entre 2012 e 2015 - em todo tempo de trabalho foi afastado varias vezes, o maior tempo que passou afastado foi um ano. nos ultimos 5 anos, trabalhou 3 anos. Trabalhava de 4 horas da manhã as 18 horas. Trabalhava fazendo queijo perto de um forno. Salário de R$ 2.000,00. Trabalhava de domingo a domingo. Foi demitido sem justa causa e não recebeu nada.',
				// 'natureza-da-acao': 'Reconhecimento de vínculo empregatício',
				// 'objetivos': 'Reconhecimento de vínculo empregatício, horas extras, adicional noturno, adicional de insalubridade, aviso prévio, 13º salário, férias, FGTS, multa de 40% do FGTS, indenização por danos morais, honorários advocatícios',
			}
    };  
  },
  computed: {
    modelo() {
	    return this.modelos.find(modelo => modelo.nome === this.$route.params.modelo);
      // return this.$route.params.modelo;
    }
  },
	methods: {
		async handlePrompt () {
			vm.loading = true;
			const OpenAI = require('openai');

			var promptFatos = `
				Caros assistentes IA,

				Estou trabalhando num caso na área de "${this.formData['area-do-direito']}" relacionado a "${this.formData['caso-concreto']}" cuja natureza da ação é "${this.formData['natureza-da-acao']}". Meu objetivo na ação é alcançar os seguintes pedidos: "${this.formData.objetivos}". Solicito sua ajuda na elaboração dos seguintes tópicos da petição inicial, e peço que apresentem as informações em formato de parágrafos, evitando listas ou enumerações:
				
				Dos fatos:
				
				Descrevam os fatos do caso de forma detalhada, clara e persuasiva, narrando a situação apresentada em formato de parágrafo contínuo.
			`;

			var promptFundamentos = `
				Caros assistentes IA,

				Estou trabalhando num caso na área de "${this.formData['area-do-direito']}" relacionado a "${this.formData['caso-concreto']}" cuja natureza da ação é "${this.formData['natureza-da-acao']}". Meu objetivo na ação é alcançar os seguintes pedidos: "${this.formData.objetivos}". Solicito sua ajuda na elaboração dos seguintes tópicos da petição inicial, e peço que apresentem as informações em formato de parágrafos, evitando listas ou enumerações:
				
				Dos fundamentos jurídicos:
				
				Fundamentem o caso de forma robusta, utilizando a legislação, princípios e jurisprudências da "${this.formData['area-do-direito']}" que sejam pertinentes ao caso concreto: "${this.formData['caso-concreto']}". Os fundamentos devem conduzir de forma lógica aos "${this.formData.objetivos}" e ser apresentados em formato de parágrafo contínuo, sem listas ou enumerações.
			`;

			// se vm apikey não estiver setada, acionar um aviso com swal
			if (vm.apiKey === '') {
				Swal.fire({
					toast: true,
					position: 'top-end',
					showConfirmButton: true,
					timer: 4500,
					title: 'Você precisa configurar sua API Key!',
					text: 'Clique em Definições e preencha o campo" para configurar sua API Key',
					icon: 'warning',
				})

				return
			}
			
			try {
				var openai = new OpenAI({
					apiKey: vm.apiKey,
					dangerouslyAllowBrowser: true
				});
	
			} catch (error) {
				Swal.fire({
					toast: true,
					position: 'top-end',
					showConfirmButton: true,
					timer: 4500,
					title: error.message,
					type: 'error',
				})
				vm.loading = false;
				return
			}

			try {
				const responseFatos = await openai.chat.completions.create({
					model: "gpt-3.5-turbo-16k",
					messages: [
						{
							"role": "user",
							"content": promptFatos
						}
					],
					temperature: 1,
					max_tokens: 10000,
					top_p: 1,
					frequency_penalty: 0,
					presence_penalty: 0,
				});
				
				this.formData['dos-fatos'] = responseFatos.choices[0].message.content;
				
			} catch (error) {
				Swal.fire({
					toast: true,
					position: 'top-end',
					showConfirmButton: true,
					timer: 4500,
					title: error.message,
					type: 'error',
				})
				vm.loading = false;
				return
			}
			
			try {		
				const responseFundamentos = await openai.chat.completions.create({
					model: "gpt-3.5-turbo-16k",
					messages: [
						{
							"role": "user",
							"content": promptFundamentos
						}
					],
					temperature: 1,
					max_tokens: 10000,
					top_p: 1,
					frequency_penalty: 0,
					presence_penalty: 0,
				});
				
				this.formData['dos-fundamentos'] = responseFundamentos.choices[0].message.content;
				
			} catch (error) {
				Swal.fire({
					toast: true,
					position: 'top-end',
					showConfirmButton: true,
					timer: 4500,
					title: error.message,
					type: 'error',
				})
				vm.loading = false;
				return 
			}
		
			vm.loading = false;

			this.handleInputs();

		},

    async handleInputs() {
			// this.formData


			const document = Swal.mixin({
				toast: true,
				position: 'top-end',
				showConfirmButton: true,
				timer: 4500
			})

			console.log(vm.modelsFolders)
			var PizZip = require('pizzip');
			var Docxtemplater = require('docxtemplater');
			
			
			//Load the docx file as a binary
			try {
				// console.log(vm.modelsFolder + platformFileWay() + modelName);
				var content = fs.readFileSync(vm.modelsFolder + platformFileWay() + 'peticao-inicial-ia.docx', 'binary');
			} catch (err) {
				document.fire({
					type: 'error',
					title: 'Não foi possível gerar um documento, selecione um modelo antes!'
				})
			}
    
			var zip = new PizZip(content);
    
			var doc = new Docxtemplater();
			doc.loadZip(zip);  
			doc.setOptions({linebreaks: true});


			
			//set the templateVariables
			doc.setData(this.formData);
			
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
			
			var month = (today.getMonth()+1).toString();
			let fileName = `${vm.documentsFolder}\\(${today.getDate()}-${month}-${today.getFullYear()} ${today.getHours()}hrs ${today.getMinutes()}min) peticao-inicial.docx`
			// buf is a nodejs buffer, you can either write it to a file or do anything else with it.
			fs.writeFileSync(fileName, buf);
	
			document.fire({
				type: 'success',
				title: 'O documento foi gerado!',
				showConfirmButton: true,
				confirmButtonText: 'Abrir na pasta de documentos gerados.',
				timer: 10000,
				preConfirm: () => {
					const {shell} = require('electron');
					shell.showItemInFolder(fileName)
				}
			})
			
		},
		setDocument ( ) {

		}
	}

};

window.IaGenerator = IaGenerator;