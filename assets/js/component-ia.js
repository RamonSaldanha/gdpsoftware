const { default: Swal } = require('sweetalert2');
const OpenAI = require('openai');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const MAX_TOKENS = 7200;
const GPT_MODEL = "gpt-4";

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
		async createOpenAIPrompt(promptContent) {
			try {
					const openai = new OpenAI({
							apiKey: vm.apiKey,
							dangerouslyAllowBrowser: true
					});
					return await openai.chat.completions.create({
							model: GPT_MODEL,
							messages: [{ "role": "user", "content": promptContent }],
							temperature: 1,
							max_tokens: MAX_TOKENS,
							top_p: 1,
							frequency_penalty: 0,
							presence_penalty: 0,
					});
			} catch (error) {
					this.displayAlert(error.message, 'error');
					throw error;
			}
	},
	
	displayAlert(message, type = 'warning', title = null, options = {}) {
			Swal.fire({
					toast: true,
					position: 'top-end',
					showConfirmButton: true,
					// timer: 4500,
					title: title || message,
					text: message,
					icon: type,
					...options
			});
	},
	createParagraphs(texto) {

		return texto.split("\n")
								.filter(p => p.trim() !== "") // remove parágrafos vazios
								.map(p => ({ line: p.trim() })); // mapeia cada parágrafo para o formato desejado
	},
	async handlePrompt() {
			vm.loading = true;
	
			if (!vm.apiKey) {
					this.displayAlert('Você precisa configurar sua API Key!', 'warning', null, {
							text: 'Clique em Definições e preencha o campo" para configurar sua API Key',
					});
					vm.loading = false;
					return;
			}
	
			const basePrompt = `
					Caros assistentes IA,
					Estou trabalhando num caso na área de "${this.formData['area-do-direito']}" relacionado a "${this.formData['caso-concreto']}" cuja natureza da ação é "${this.formData['natureza-da-acao']}". Meu objetivo na ação é alcançar os seguintes pedidos: "${this.formData.objetivos}". Solicito sua ajuda na elaboração do seguinte tópico da petição inicial, e peço que apresentem as informações em formato de parágrafos, evitando listas ou enumerações:
			`;
	
			const promptFatos = `${basePrompt} Dos fatos: Descrevam os fatos do caso de forma detalhada, clara e persuasiva, narrando a situação apresentada em formato de parágrafo contínuo.`;
	
			const promptFundamentos = `${basePrompt} Dos fundamentos jurídicos: Fundamentem o caso de forma robusta, utilizando a legislação, princípios e jurisprudências da "${this.formData['area-do-direito']}" que sejam pertinentes ao caso concreto: "${this.formData['caso-concreto']}". Os fundamentos devem conduzir de forma lógica aos "${this.formData.objetivos}" e ser apresentados em formato de parágrafo contínuo, sem listas ou enumerações.`;
	
			try {

					Swal.fire({
						toast: true,
						position: 'top-end',
						title: 'Aguarde! Estamos redigindo os fatos...',
						icon: 'info',  // Mude 'type' para 'icon'
						showConfirmButton: true,
						didOpen: () => {  // Corrija a sintaxe da função aqui
							Swal.showLoading();
						}
					});
				
					const responseFatos = await this.createOpenAIPrompt(promptFatos);
					
					this.formData['dos-fatos'] = this.createParagraphs(responseFatos.choices[0].message.content);

					Swal.fire({
						toast: true,
						position: 'top-end',
						title: 'Aguarde! Agora estamos redigindo os fundamentos...',
						icon: 'info',  // Mude 'type' para 'icon'
						showConfirmButton: true,
						didOpen: () => {  // Corrija a sintaxe da função aqui
							Swal.showLoading();
						}
					});

					const responseFundamentos = await this.createOpenAIPrompt(promptFundamentos);
					this.formData['dos-fundamentos'] = this.createParagraphs(responseFundamentos.choices[0].message.content);
			} catch (error) {
					vm.loading = false;
					return;
			}
	
			vm.loading = false;
			this.handleInputs();
	},
	
	async handleInputs() {
			const document = Swal.mixin({
					toast: true,
					position: 'top-end',
					showConfirmButton: true,
			});
	
			var content;
			try {
					content = fs.readFileSync(vm.modelsFolder + platformFileWay() + 'peticao-inicial-ia.docx', 'binary');
			} catch (err) {
					document.fire({
							type: 'error',
							title: 'Não foi possível gerar um documento, selecione um modelo antes!'
					});
					return;
			}
	
			const zip = new PizZip(content);
			const doc = new Docxtemplater();
			doc.loadZip(zip);
			doc.setOptions({ linebreaks: true });
	
			doc.setData(this.formData);
	
			try {
					doc.render();
			} catch (error) {
					throw error;
			}
	
			const buf = doc.getZip().generate({ type: 'nodebuffer' });
			const today = new Date();
			const month = (today.getMonth() + 1).toString();
			const fileName = `${vm.documentsFolder}\\(${today.getDate()}-${month}-${today.getFullYear()} ${today.getHours()}hrs ${today.getMinutes()}min) peticao-inicial.docx`;
	
			fs.writeFileSync(fileName, buf);
	
			document.fire({
					type: 'success',
					title: 'O documento foi gerado!',
					showConfirmButton: true,
					confirmButtonText: 'Abrir na pasta de documentos gerados.',
					// timer: 10000,
					preConfirm: () => {
							shell.showItemInFolder(fileName)
					}
			});
		}
	}

};

window.IaGenerator = IaGenerator;