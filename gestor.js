// Use a URL da DigitalOcean para a versão online
//const BACKEND_URL = 'https://king-prawn-app-6jvyu.ondigitalocean.app';

// Use esta URL para rodar localmente no seu computador
const BACKEND_URL = "http://localhost:8080";

// Variável para armazenar a versão do backend
let backendVersion = 'desconhecida';

// Elementos de tela
const app = document.getElementById('app');
const loginScreen = document.getElementById('login-screen');
const tecbinsOptionsScreen = document.getElementById('tecbins-options-screen');
const setupOptionsScreen = document.getElementById('setup-options-screen');
const cadastroSalaScreen = document.getElementById('cadastro-sala-screen');
const cadastroOperadorScreen = document.getElementById('cadastro-operador-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

// Elementos de formulário e botões
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const acessarConsultaBtn = document.getElementById('acessar-consulta-btn');
const setupBtn = document.getElementById('setup-btn');
const logoutBtn = document.getElementById('logout-btn');
const logoutFromSetupBtn = document.getElementById('logout-from-setup-btn');
const logoutFromTecbinsOptionsBtn = document.getElementById('logout-from-tecbins-options-btn');
const cadastrarSalaBtn = document.getElementById('cadastrar-sala-btn');
const cadastroOperadorBtn = document.getElementById('cadastro-operador-btn');
const voltarBtn = document.getElementById('voltar-btn');
const voltarSetupSalaBtn = document.getElementById('voltar-setup-sala-btn');
const voltarSetupOperadorBtn = document.getElementById('voltar-setup-operador-btn');
const cadastroSalaForm = document.getElementById('cadastro-sala-form');
const nomeSalaInput = document.getElementById('nome-sala');
const idSalaInput = document.getElementById('id-sala');
const listaSalasContainer = document.getElementById('lista-salas-container');
const cadastroOperadorForm = document.getElementById('cadastro-operador-form');
const operadorNomeInput = document.getElementById('operador-nome');
const operadorSenhaInput = document.getElementById('operador-senha');
const salasCheckboxesDiv = document.getElementById('salas-checkboxes');
const listaOperadoresContainer = document.getElementById('lista-operadores-container');
const dataForm = document.getElementById('data-form');
const salaSelect = document.getElementById('sala-select');
const dataInicialInput = document.getElementById('data-inicial-input');
const dataFinalInput = document.getElementById('data-final-input');
const dataContainer = document.getElementById('data-container');
const messageContainer = document.getElementById('message-container');
const cartoesBtn = document.getElementById('cartoes-btn');
const tabelaBtn = document.getElementById('tabela-btn');

// NOVOS ELEMENTOS
const colecoesBotoesDiv = document.getElementById('colecoes-botoes');

let salasPermitidas = [];
let operadorLogado = '';
let colecaoSelecionada = '';
let salaSelecionada = '';
let lastFetchedData = null;

// Funções de formatação
function formatarDataPadrao(dataString) {
    if (!dataString) return { dia: '', mes: '', ano: '' };
    // Remove espaços em branco antes e depois e divide a string
    const partes = dataString.trim().split('/');
    if (partes.length !== 3) {
        console.error('Formato de data inválido:', dataString);
        return { dia: '', mes: '', ano: '' };
    }
    // Retorna um objeto com o dia, mês e ano
    return {
        dia: partes[0],
        mes: partes[1],
        ano: partes[2]
    };
}
function formatarDataParaDia(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.getDate().toString().padStart(2, '0');
}

function formatarValorMonetario(valor) {
    if (typeof valor !== 'number') return valor;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função para exibir telas
function showScreen(screen) {
    document.querySelectorAll('#app > div').forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');

    if (screen === dashboardScreen) {
        // Define a data atual como padrão para os campos de data
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        dataInicialInput.value = todayStr;
        dataFinalInput.value = todayStr;
    }
}

// Função para buscar a versão do backend
async function fetchBackendVersion() {
    try {
        const response = await fetch(`${BACKEND_URL}/`);
        const data = await response.json();
        backendVersion = data.version || 'desconhecida';
        console.log(`Versão do Backend: ${backendVersion}`);
    } catch (error) {
        console.error("Erro ao buscar a versão do backend:", error);
    }
}


// Inicialização e autenticação
document.addEventListener('DOMContentLoaded', () => {
    // Busca a versão do backend ao carregar a página
    fetchBackendVersion();
    
    operadorLogado = localStorage.getItem('operadorLogado');
    const idsalas = JSON.parse(localStorage.getItem('salasPermitidas'));

    console.log('Verificando login... Operador:', operadorLogado, 'Salas:', idsalas);

    if (operadorLogado && idsalas) {
        salasPermitidas = idsalas;
        updateOperatorNameDisplay();
        
        // LÓGICA ALTERADA: Se for TECBIN, popula TODAS as salas.
        if (operadorLogado.toUpperCase() === 'TECBIN') {
            showScreen(tecbinsOptionsScreen);
            setupBtn.classList.remove('hidden');
            populateAllSalasSelect(); // Popula com TODAS as salas
        } else {
            // Se não for TECBIN, vai direto para o dashboard
            showScreen(dashboardScreen);
            setupBtn.classList.add('hidden');
            // Popula com as salas permitidas
            populateSalaSelect(salasPermitidas);
            // Define a sala padrão como a primeira da lista
            if (salasPermitidas.length > 0) {
                salaSelect.value = salasPermitidas[0];
            }
        }
        
        populateColecaoSelect();
    } else {
        showScreen(loginScreen);
    }
});

function updateOperatorNameDisplay() {
    const operatorDisplays = document.querySelectorAll('.operator-name-display');
    operatorDisplays.forEach(el => {
        el.textContent = operadorLogado ? `Operador: ${operadorLogado}` : '';
    });
}

async function login(operador, senha) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ operador, senha })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const data = await response.json();
        
        localStorage.setItem('operadorLogado', data.nome);
        localStorage.setItem('salasPermitidas', JSON.stringify(data.idsalas));

        operadorLogado = data.nome;
        salasPermitidas = data.idsalas;
        updateOperatorNameDisplay();
        
        if (operadorLogado.toUpperCase() === 'TECBIN') {
            showScreen(tecbinsOptionsScreen);
            setupBtn.classList.remove('hidden');
            populateAllSalasSelect();
        } else {
            showScreen(dashboardScreen);
            setupBtn.classList.add('hidden');
            populateSalaSelect(salasPermitidas);
        }

        populateColecaoSelect();
        loginMessage.textContent = '';
    } catch (error) {
        console.error('Erro de autenticação:', error);
        loginMessage.textContent = error.message || 'Erro ao tentar fazer login. Verifique suas credenciais.';
    }
}

async function logout() {
    localStorage.removeItem('operadorLogado');
    localStorage.removeItem('salasPermitidas');
    operadorLogado = '';
    salasPermitidas = [];
    showScreen(loginScreen);
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const operador = e.target.operador.value.toUpperCase();
    const senha = e.target.senha.value;
    await login(operador, senha);
});

acessarConsultaBtn.addEventListener('click', () => {
    showScreen(dashboardScreen);
    populateSalaSelect(salasPermitidas);
    if (salasPermitidas.length > 0) {
        salaSelect.value = salasPermitidas[0];
    }
});

setupBtn.addEventListener('click', () => showScreen(setupOptionsScreen));
logoutBtn.addEventListener('click', logout);
logoutFromSetupBtn.addEventListener('click', logout);
logoutFromTecbinsOptionsBtn.addEventListener('click', logout);
voltarBtn.addEventListener('click', () => showScreen(tecbinsOptionsScreen));
voltarSetupSalaBtn.addEventListener('click', () => showScreen(setupOptionsScreen));
voltarSetupOperadorBtn.addEventListener('click', () => showScreen(setupOptionsScreen));
cadastrarSalaBtn.addEventListener('click', () => {
    showScreen(cadastroSalaScreen);
    fetchSalas();
});
cadastroOperadorBtn.addEventListener('click', () => {
    showScreen(cadastroOperadorScreen);
    fetchSalasParaCheckboxes();
    fetchOperadores();
});

// Funções para popular os selects
async function populateSalaSelect(idsalasPermitidas) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/salas`);
        const salas = await response.json();
        salaSelect.innerHTML = '';
        salas.forEach(sala => {
            if (idsalasPermitidas.includes(sala.idsala)) {
                const option = document.createElement('option');
                option.value = sala.idsala;
                option.textContent = sala.nomesala;
                salaSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar as salas:", error);
    }
}

async function populateAllSalasSelect() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/salas`);
        const salas = await response.json();
        salaSelect.innerHTML = '';
        salas.forEach(sala => {
            const option = document.createElement('option');
            option.value = sala.idsala;
            option.textContent = sala.nomesala;
            salaSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar as salas:", error);
    }
}

// Função alterada para popular as coleções como botões com as novas regras
async function populateColecaoSelect() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/tabelas`);
        const colecoes = await response.json();
        const colecoesPrincipais = [];
        const colecoesJaAdicionadas = new Set();
        
        // Tabelas a serem excluídas da lista
        const tabelasExcluidas = ['SALA', 'OPERADORES'];

        colecoes.forEach(colecao => {
            // Ignora tabelas a serem excluídas
            if (tabelasExcluidas.includes(colecao.toUpperCase())) {
                return;
            }

            const regex = /\d{6}$/;
            const nomeBase = colecao.replace(regex, '');
            if (nomeBase && nomeBase !== colecao && !colecoesJaAdicionadas.has(nomeBase)) {
                colecoesPrincipais.push(nomeBase);
                colecoesJaAdicionadas.add(nomeBase);
            } else if (!colecao.includes('system.') && !colecao.match(regex) && !colecoesJaAdicionadas.has(colecao)) {
                colecoesPrincipais.push(colecao);
                colecoesJaAdicionadas.add(colecao);
            }
        });

        colecoesBotoesDiv.innerHTML = '';
        
        colecoesPrincipais.sort().forEach(colecao => {
            const button = document.createElement('button');
            button.textContent = colecao;
            // Classes para padronizar o tamanho dos botões
            button.classList.add('bg-gray-600', 'hover:bg-gray-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'focus:outline-none', 'focus:shadow-outline', 'min-w-[120px]');
            button.addEventListener('click', () => {
                document.querySelectorAll('#colecoes-botoes button').forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                    btn.classList.add('bg-gray-600', 'hover:bg-gray-700');
                });
                button.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                button.classList.add('bg-blue-600', 'hover:bg-blue-700');
                colecaoSelecionada = colecao;
                
                // CORREÇÃO: A lista de coleções sem data precisa ser a mesma que a do backend.
                const colecoesSemData = ['sala', 'salas', 'operador', 'operadores', 'funcionario', 'funcionarios', 'atendente', 'atendentes', 'agenda', 'casa'];
                const isDateTable = !colecoesSemData.includes(colecao.toLowerCase());
                
                dataInicialInput.disabled = !isDateTable;
                dataFinalInput.disabled = !isDateTable;
                dataInicialInput.style.opacity = isDateTable ? '1' : '0.5';
                dataFinalInput.style.opacity = isDateTable ? '1' : '0.5';
            });
            colecoesBotoesDiv.appendChild(button);
        });

        if (colecoesBotoesDiv.firstChild) {
            colecoesBotoesDiv.firstChild.click();
        }

    } catch (error) {
        console.error("Erro ao carregar as coleções:", error);
    }
}

// Funções de busca e exibição de dados
dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // NOVO LOG NO FRONTEND
    console.log(`[LOG] Requisição acionada do Frontend - Versão do Backend: ${backendVersion}`);

    messageContainer.textContent = '';
    dataContainer.innerHTML = 'Buscando dados...';

    const salaId = salaSelect.value;
    const colecaoBase = colecaoSelecionada;

    if (!salaId || !colecaoBase) {
        messageContainer.textContent = 'Por favor, selecione a sala e a coleção.';
        dataContainer.innerHTML = '';
        return;
    }

    const params = new URLSearchParams();
    params.append('colecao_base', colecaoBase);
    params.append('idsala', salaId);
    
    // CORREÇÃO: Usa a mesma lógica para determinar se os parâmetros de data devem ser enviados
    const colecoesSemData = ['sala', 'salas', 'operador', 'operadores', 'funcionario', 'funcionarios', 'atendente', 'atendentes', 'agenda', 'casa'];
    if (!colecoesSemData.includes(colecaoBase.toLowerCase())) {
        params.append('data_inicial', dataInicialInput.value);
        params.append('data_final', dataFinalInput.value);
    }

    const url = `${BACKEND_URL}/api/dados?${params.toString()}`;
    console.log("URL da requisição:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao buscar dados.');
        }
        lastFetchedData = await response.json();
        
        if (lastFetchedData.length === 0) {
            messageContainer.textContent = 'Nenhum dado encontrado para os filtros selecionados.';
            dataContainer.innerHTML = ''; // Limpar o container se não houver dados
        } else {
            messageContainer.textContent = `${lastFetchedData.length} resultados encontrados.`;
            // ALTERADO: Muda a visualização padrão para cartões
            showCartoes();
        }
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        messageContainer.textContent = `Erro ao buscar dados: ${error.message}`;
        dataContainer.innerHTML = '';
    }
});


function showTabela() {
    if (!lastFetchedData || lastFetchedData.length === 0) return;
    
    // Remove as classes de layout flex e de fundo do container
    dataContainer.classList.remove('flex', 'flex-wrap', 'gap-4', 'justify-center', 'md:justify-start', 'bg-black');

    const data = lastFetchedData;
    const table = document.createElement('table');
    table.classList.add('min-w-full', 'divide-y', 'divide-gray-600', 'bg-gray-400');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = Object.keys(data[0]);
    // Filtra os campos ID, IDSALA e _id
    const filteredHeaders = headers.filter(header => header.toUpperCase() !== 'ID' && header.toUpperCase() !== 'IDSALA' && header !== '_id');

    filteredHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.classList.add('py-3', 'px-6', 'text-left', 'text-xs', 'font-medium', 'bg-gray-800','text-gray-400', 'uppercase', 'tracking-wider');
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.classList.add('text-sm','font-bold','bg-gray-800', 'divide-y', 'divide-gray-600');
    data.forEach(item => {
        const tr = document.createElement('tr');
        filteredHeaders.forEach(header => {
            // VALIDAÇÃO ATUALIZADA: Agora verifica se o valor é nulo/NaN ou uma string "null"/"NaN"
            const valor = item[header];
            const isNullOrNaNString = typeof valor === 'string' && (valor.toLowerCase() === 'null' || valor.toLowerCase() === 'nan');

            if (valor != null && !(typeof valor === 'number' && isNaN(valor)) && !isNullOrNaNString) {
                const td = document.createElement('td');
                td.classList.add('py-4', 'px-6', 'whitespace-nowrap', 'text-sm', 'bg-gray-900','text-gray-300');
                
                let valorFormatado = valor;
                
                // Formatar valores

                if (typeof valor === 'number' && (header.toLowerCase().includes('valor') || header.toLowerCase().includes('total'))) {
                   valorFormatado = formatarValorMonetario(valor);
                } else if (header.toLowerCase().includes('data') || header.toLowerCase().includes('dia')) {
    // Usando a nova função para extrair o dia
                   const dataFormatada = formatarDataPadrao(valor);
                   valorFormatado = dataFormatada.dia;
                } else if (header.toLowerCase().includes('mes')) {
    // Para obter o mês, você pode criar uma nova condição
                  const dataFormatada = formatarDataPadrao(valor);
                  valorFormatado = dataFormatada.mes;
                }

                td.textContent = valorFormatado;
                tr.appendChild(td);
            }
        });
        // Adiciona a linha apenas se ela tiver células
        if (tr.children.length > 0) {
            tbody.appendChild(tr);
        }
    });
    table.appendChild(tbody);
    dataContainer.innerHTML = '';
    dataContainer.appendChild(table);
}

function showCartoes() {
    if (!lastFetchedData || lastFetchedData.length === 0) return;
    
    // CORREÇÃO: Adiciona !bg-black para forçar a cor de fundo
    dataContainer.classList.add('flex', 'flex-wrap', 'gap-4', 'justify-center', 'md:justify-start', 'bg-black', '!bg-black');

    dataContainer.innerHTML = '';
    lastFetchedData.forEach(item => {
        const card = document.createElement('div');
        // CORREÇÃO: Adiciona a largura mínima para o layout horizontal
        card.classList.add('bg-gray-900', 'p-4', 'rounded-lg', 'shadow-md', 'mb-4', 'break-words', 'min-w-[280px]', 'flex-1');
        
        for (const key in item) {
            // VALIDAÇÃO ATUALIZADA: Agora verifica se o valor é nulo/NaN ou uma string "null"/"NaN"
            const valor = item[key];
            const isNullOrNaNString = typeof valor === 'string' && (valor.toLowerCase() === 'null' || valor.toLowerCase() === 'nan');

            if (key.toUpperCase() !== 'ID' && key.toUpperCase() !== 'IDSALA' && key !== '_id' && valor != null && !(typeof valor === 'number' && isNaN(valor)) && !isNullOrNaNString) {
                const p = document.createElement('p');
                p.classList.add('text-sm', 'mb-1');
                
                let valorFormatado = valor;
                
                // Formatar valores
                if (typeof valor === 'number' && (key.toLowerCase().includes('valor') || key.toLowerCase().includes('total'))) {
                    valorFormatado = formatarValorMonetario(valor);
                } else if (key.toLowerCase().includes('data') || key.toLowerCase().includes('dia')) {
                //valorFormatado = formatarDataParaDia(valor);
                  const dataFormatada = formatarDataPadrao(valor);
                  valorFormatado = dataFormatada.dia;
             }

                
                p.innerHTML = `<span class="font-bold text-blue-300">${key}:</span> ${valorFormatado}`;
                card.appendChild(p);
            }
        }
        
        // Adiciona o cartão apenas se ele tiver conteúdo (após a filtragem)
        if (card.children.length > 0) {
             dataContainer.appendChild(card);
        }
    });
}

cartoesBtn.addEventListener('click', showCartoes);
tabelaBtn.addEventListener('click', showTabela);

// Funções de gerenciamento de salas
const cancelarSalaBtn = document.getElementById('cancelar-sala-btn');
const submitSalaBtn = document.getElementById('submit-sala-btn');

cancelarSalaBtn.addEventListener('click', () => {
    cadastroSalaForm.reset();
    idSalaInput.disabled = false;
    submitSalaBtn.textContent = 'Cadastrar';
    submitSalaBtn.dataset.mode = 'create';
    document.getElementById('cadastro-sala-message').textContent = '';
});

cadastroSalaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = nomeSalaInput.value;
    const id = idSalaInput.value;

    const mode = submitSalaBtn.dataset.mode || 'create';
    const url = mode === 'edit' ? `${BACKEND_URL}/api/salas/${id}` : `${BACKEND_URL}/api/salas/cadastro`;
    const method = mode === 'edit' ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, id })
        });
        const result = await response.json();
        
        showCadastroMessage('cadastro-sala-message', result.message, response.ok);
        if (response.ok) {
            cadastroSalaForm.reset();
            idSalaInput.disabled = false;
            submitSalaBtn.textContent = 'Cadastrar';
            submitSalaBtn.dataset.mode = 'create';
            fetchSalas();
        }
    } catch (error) {
        showCadastroMessage('cadastro-sala-message', 'Erro de conexão.', false);
    }
});

async function fetchSalas() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/salas`);
        const salas = await response.json();
        listaSalasContainer.innerHTML = '';
        salas.forEach(sala => {
            const salaDiv = document.createElement('div');
            salaDiv.classList.add('flex', 'justify-between', 'items-center', 'bg-gray-700', 'p-3', 'rounded-md');
            salaDiv.innerHTML = `
                <span>${sala.nomesala} (${sala.idsala})</span>
                <div>
                    <button class="editar-sala-btn bg-yellow-500 text-white px-2 py-1 rounded text-xs mr-2" data-id="${sala.idsala}" data-nome="${sala.nomesala}">Editar</button>
                    <button class="excluir-sala-btn bg-red-600 text-white px-2 py-1 rounded text-xs" data-id="${sala.idsala}">Excluir</button>
                </div>
            `;
            listaSalasContainer.appendChild(salaDiv);
        });
        
        document.querySelectorAll('.editar-sala-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const nome = e.target.dataset.nome;
                idSalaInput.value = id;
                nomeSalaInput.value = nome;
                idSalaInput.disabled = true;
                submitSalaBtn.textContent = 'Atualizar';
                submitSalaBtn.dataset.mode = 'edit';
            });
        });

        document.querySelectorAll('.excluir-sala-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm(`Tem certeza que deseja excluir a sala com ID ${id}?`)) {
                    try {
                        const response = await fetch(`${BACKEND_URL}/api/salas/${id}`, { method: 'DELETE' });
                        const result = await response.json();
                        showCadastroMessage('cadastro-sala-message', result.message, response.ok);
                        if (response.ok) {
                            fetchSalas();
                        }
                    } catch (error) {
                        showCadastroMessage('cadastro-sala-message', 'Erro de conexão.', false);
                    }
                }
            });
        });
    } catch (error) {
        console.error("Erro ao carregar salas:", error);
    }
}

// Funções de gerenciamento de operadores
const cancelarOperadorBtn = document.getElementById('cancelar-operador-btn');
const submitOperadorBtn = document.getElementById('submit-operador-btn');

cancelarOperadorBtn.addEventListener('click', () => {
    cadastroOperadorForm.reset();
    operadorNomeInput.disabled = false;
    submitOperadorBtn.textContent = 'Cadastrar';
    submitOperadorBtn.dataset.mode = 'create';
    document.querySelectorAll('#salas-checkboxes input:checked').forEach(cb => cb.checked = false);
    document.getElementById('cadastro-operador-message').textContent = '';
});

cadastroOperadorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = operadorNomeInput.value;
    const senha = operadorSenhaInput.value;
    const idsalas = Array.from(document.querySelectorAll('#salas-checkboxes input:checked')).map(cb => cb.value);

    const mode = submitOperadorBtn.dataset.mode || 'create';
    const url = mode === 'edit' ? `${BACKEND_URL}/api/operadores/${nome}` : `${BACKEND_URL}/api/operadores/cadastro`;
    const method = mode === 'edit' ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, senha, idsalas })
        });
        const result = await response.json();

        showCadastroMessage('cadastro-operador-message', result.message, response.ok);
        if (response.ok) {
            cadastroOperadorForm.reset();
            operadorNomeInput.disabled = false;
            submitOperadorBtn.textContent = 'Cadastrar';
            submitOperadorBtn.dataset.mode = 'create';
            document.querySelectorAll('#salas-checkboxes input:checked').forEach(cb => cb.checked = false);
            fetchOperadores();
        }
    } catch (error) {
        showCadastroMessage('cadastro-operador-message', 'Erro de conexão.', false);
    }
});

async function fetchSalasParaCheckboxes() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/salas`);
        const salas = await response.json();
        salasCheckboxesDiv.innerHTML = '';
        salas.forEach(sala => {
            const label = document.createElement('label');
            label.classList.add('block', 'text-gray-300');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = sala.idsala;
            checkbox.name = 'sala-acesso';
            checkbox.classList.add('mr-2');
            label.appendChild(checkbox);
            label.append(sala.nomesala);
            salasCheckboxesDiv.appendChild(label);
        });
    } catch (error) {
        console.error("Erro ao carregar salas para checkboxes:", error);
    }
}

async function fetchOperadores() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/operadores`);
        const operadores = await response.json();
        listaOperadoresContainer.innerHTML = '';
        operadores.forEach(operador => {
            const operadorDiv = document.createElement('div');
            operadorDiv.classList.add('flex', 'justify-between', 'items-center', 'bg-gray-700', 'p-3', 'rounded-md');
            operadorDiv.innerHTML = `
                <span>${operador.nome}</span>
                <div>
                    <button class="editar-operador-btn bg-yellow-500 text-white px-2 py-1 rounded text-xs mr-2" data-nome="${operador.nome}">Editar</button>
                    <button class="excluir-operador-btn bg-red-600 text-white px-2 py-1 rounded text-xs" data-nome="${operador.nome}">Excluir</button>
                </div>
            `;
            listaOperadoresContainer.appendChild(operadorDiv);
        });

        document.querySelectorAll('.editar-operador-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const nome = e.target.dataset.nome;
                const operador = operadores.find(op => op.nome === nome);
                if (operador) {
                    operadorNomeInput.value = operador.nome;
                    operadorNomeInput.disabled = true;
                    operadorSenhaInput.value = '';
                    submitOperadorBtn.textContent = 'Atualizar';
                    submitOperadorBtn.dataset.mode = 'edit';
                    
                    document.querySelectorAll('#salas-checkboxes input').forEach(cb => {
                        cb.checked = operador.idsalas.includes(cb.value);
                    });
                }
            });
        });

        document.querySelectorAll('.excluir-operador-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const nome = e.target.dataset.nome;
                if (confirm(`Tem certeza que deseja excluir o operador ${nome}?`)) {
                    try {
                        const response = await fetch(`${BACKEND_URL}/api/operadores/${nome}`, { method: 'DELETE' });
                        const result = await response.json();
                        showCadastroMessage('cadastro-operador-message', result.message, response.ok);
                        if (response.ok) {
                            fetchOperadores();
                        }
                    } catch (error) {
                        showCadastroMessage('cadastro-operador-message', 'Erro de conexão.', false);
                    }
                }
            });
        });
    } catch (error) {
        console.error("Erro ao carregar operadores:", error);
    }
}

function showCadastroMessage(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    if (isSuccess) {
        element.classList.remove('text-red-500');
        element.classList.add('text-green-500');
    } else {
        element.classList.remove('text-green-500');
        element.classList.add('text-red-500');
    }
}