const { default: Swal } = require('sweetalert2');
const OpenAI = require('openai');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
let MAX_TOKENS = 8192;
const MARGIN_TOKENS = 500;
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

							<textarea rows="7" maxlength="2190" v-if="inputField.type === 'textarea'"
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
			messageHistory: [],
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
				// 'area-do-direito': 'Direito do consumidor',
				// 'caso-concreto': 'Larissa, no dia 17 de outubro de 2022 com intuito de adquirir crédito para comprar um imóvel passou a pesquisar nas redes sociais. Ela encontrou um anúncio nas redes sociais de um imóvel com entrada de entre R$ 8 e 10mil pagando o remanescente em parcelas de R$ 500,00. Ela estava muito inclinada em adquirir um imóvel porque morava de favor e a dona da casa estava pedindo de volta. Ao entrar em contato com a empresa-ré, foi dito que ela até dezembro de 2022 ela estaria no imóvel vendido Até então, ela achava que iria assinar um contrato de financiamento. Ela foi instruída a assinar o contrato e foi instruída a responder perguntas por telefone para uma financeira que seria a em tese, a matriz. Até então ela achava que iria dar certo. Eles foram muito persuasivos e orientaram que se ela não respondesse as perguntas da matriz, conforme eles orientavam, ela não teria seu crédito aceito. Eles ligaram primeiro para ela para se certificar de que ela responderia conforme orientaram. Posteriormente, ligaram dizendo que ela nao respondeu corretamente, advertindo-a que se ela respondesse que teria sido prometida crédito antecipado, ela não iria conseguir o crédito do imóvel. Nessa ocasião, ela já tinha pago o valor da entrada (R$ 8.923,08) da entrada do suposto financiamento e se sentiu bem pressionada a prosseguir com as orientações. Após o telefonema de confirmação da empresa de consórcio, ela recebeu acesso a um aplicativo da Promove, foi quando ela percebeu que teria na verdade adquirido um consórcio, que ela sequer sabia do que se tratava. Mas em um momento a vendedora da empresa passou a não responder as perguntas. Ela perdeu acesso ao usuário do aplicativo da "Promove". A mãe dela foi até a empresa e percebeu que a empresa teria saído do local. Uma outra pessoa indicou outro lugar e aí só então a vendedora do início entrou em contato, por nome ana luísa. Quando ela descobriu que era uma fraude, pediu desistência. Escreveu uma carta a mão para a desistência. Ela teria que passar por um sorteio para ser contemplada com a desistência. Quando recebeu resposta da desistência percebeu que só teria R$ 500,00 a receber. Mesmo assim nunca recebeu o dinheiro.',
				// 'natureza-da-acao': 'Indenização por danos morais e materiais',
				// 'objetivos': 'A autora busca a condenação da ré ao pagamento de indenização por danos morais e materiais, no valor de R$ 10.000,00 (dez mil reais), além de honorários advocatícios e custas processuais.',
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
		countTokens(messages) {
			// Função interna para contar tokens de um texto usando regex
			function countTokensForText(text) {
				const matches = text.match(/[\s\W]+/g);
				return matches ? matches.length + 1 : 1;
			}
	
			// Se não for um array, considera como uma única string
			if (!Array.isArray(messages)) {
				messages = [messages];
			}
	
			// Conta os tokens para cada mensagem e soma tudo
			return messages.reduce((totalTokens, message) => {
				return totalTokens + countTokensForText(message.content);
			}, 0);
		},
		async createOpenAIPrompt(promptContent) {
			// Cria uma cópia do histórico atual para não modificar o original
			let tempHistory = [...this.messageHistory];
				
			// Adiciona a nova mensagem à cópia do histórico
			tempHistory.push({
					role: "user",
					content: promptContent
			});

			// Calcula os tokens para a cópia do histórico
			const tokensUsed = this.countTokens(tempHistory);
			
			if (tokensUsed > MAX_TOKENS) {
					this.displayAlert('Seu texto excede o limite de tokens permitidos, tente ser mais suscinto na narração do caso concreto', 'error');
					throw new Error('Seu texto excede o limite de tokens permitidos');
			} 
			
			const TOKENS_LIMITED = MAX_TOKENS - MARGIN_TOKENS - tokensUsed;
		

			this.messageHistory.push({
        role: "user",
        content: promptContent
    	});

			
			try {
					const openai = new OpenAI({
							apiKey: vm.apiKey,
							dangerouslyAllowBrowser: true
					});
					return await openai.chat.completions.create({
							model: GPT_MODEL,
							messages: this.messageHistory,
							temperature: 1,
							max_tokens: TOKENS_LIMITED,
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
			this.messageHistory = [];

			vm.loading = true;
	
			if (!vm.apiKey) {
					this.displayAlert('Você precisa configurar sua API Key!', 'warning', null, {
							text: 'Clique em Definições e preencha o campo" para configurar sua API Key',
					});
					vm.loading = false;
					return;
			}
	
			const basePrompt = `
					Caro assistente IA,
					Estou trabalhando num caso na área do "${this.formData['area-do-direito']}" relacionado ao seguinte caso concreto: "${this.formData['caso-concreto']}" cuja natureza da ação é "${this.formData['natureza-da-acao']}". Meu objetivo na ação é alcançar os seguintes pedidos: "${this.formData.objetivos}". Na redação, utilize sempre a terceira pessoa do singular.
			`;
	
			const promptFatos = `${basePrompt} Solicito ajuda na elaboração do tópico "dos fatos", e peço que apresentem as informações em formato de parágrafos, evitando listas ou enumerações: Dos fatos: Descreva os fatos de forma clara e concisa. Evite parágrafos e textos longos, mas descreva todos os detalhes do caso concreto. O texto tem que ser fluido e de fácil compreensão, mas também tem que ser persuasivo para convencer que o autor tem o direito para atingir os seus objetivos.`;
	
			const promptFundamentos = `Agora, gostaria que você redigisse o tópico: "Fundamentos jurídicos". Este tópico deve conter os fundamentos nas legislações que amparam o direito da parte autora. Lembre-se de redigir de forma clara e concisa, de fácil compreensão, mas também persuasiva, para convencer que o autor tem o direito para atingir os seus objetivos. `;
	
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

					// adiciona a resposta do sistema ao chat
					// this.messageHistory.push({
					// 	role: "system",
					// 	content: responseFatos.choices[0].message.content
					// });

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
					
					// adiciona a resposta do sistema ao chat
					// this.messageHistory.push({
					// 	role: "system",
					// 	content: responseFundamentos.choices[0].message.content
					// });

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