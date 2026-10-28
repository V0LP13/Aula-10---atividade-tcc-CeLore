(() => {
  "use strict";

  const STORAGE_KEY = "celore_dms_clients_v1";
  const form = document.querySelector("#client-form");
  const nameInput = document.querySelector("#name");
  const numberInput = document.querySelector("#number");
  const typeSelect = document.querySelector("#select");
  const list = document.querySelector("#client-list");
  const emptyState = document.querySelector("#empty-state");
  const searchInput = document.querySelector("#search");
  const clientCount = document.querySelector("#client-count");
  const formTitle = document.querySelector("#form-title");
  const submitButton = document.querySelector("#submit-button");
  const cancelEditButton = document.querySelector("#cancel-edit");
  const toast = document.querySelector("#toast");

  let clients = loadClients();
  let editingId = null;
  let toastTimer;

  // Dados de demonstração usados apenas quando ainda não há registros salvos.
  if (clients === null) {
    clients = [
      { id: createId(), name: "John Doe", number: "11912345678", type: "Comprador" },
      { id: createId(), name: "Jane Smith", number: "11987654321", type: "Vendedor" },
      { id: createId(), name: "Bob Johnson", number: "11555555555", type: "Serviço" }
    ];
    saveClients();
  }

  function createId() {
    return (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadClients() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Não foi possível ler os dados salvo:", error);
      return [];
    }
  }

  function saveClients() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error("Não foi possível salvar:", error);
      showToast("Não foi possível salvar os dados neste navegador.");
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function renderClients() {
    const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = clients.filter(client =>
      client.name.toLocaleLowerCase("pt-BR").includes(query)
    );

    clientCount.textContent = clients.length;
    list.innerHTML = "";

    filtered.forEach(client => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div class="model-cell">
            <span class="moto-mini-icon"><i class="fa-solid fa-motorcycle"></i></span>
            <span>${escapeHTML(client.name)}</span>
          </div>
        </td>
        <td>${escapeHTML(client.number)}</td>
        <td>${escapeHTML(client.type)}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn" type="button" data-action="edit" data-id="${escapeHTML(client.id)}" aria-label="Editar ${escapeHTML(client.name)}" title="Editar">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn delete" type="button" data-action="delete" data-id="${escapeHTML(client.id)}" aria-label="Excluir ${escapeHTML(client.name)}" title="Excluir">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>`;
      list.appendChild(row);
    });

    emptyState.classList.toggle("hidden", filtered.length > 0);
  }

  function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Novo Cliente";
    submitButton.innerHTML = '<i class="fa-solid fa-plus"></i><span>Cadastrar cliente</span>';
    cancelEditButton.classList.add("hidden");
  }

  function startEdit(id) {
    const client = clients.find(item => item.id === id);
    if (!client) return;

    editingId = id;
    nameInput.value = client.name;
    numberInput.value = client.number;
    typeSelect.value = client.type;
    formTitle.textContent = "Editar Cliente";
    submitButton.innerHTML = '<i class="fa-solid fa-check"></i><span>Salvar alterações</span>';
    cancelEditButton.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInput.focus({ preventScroll: true });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const number = numberInput.value.trim();
    const type = typeSelect.value;

    if (!name) {
      showToast("Informe o nome do cliente.");
      nameInput.focus();
      return;
    }
    if (!/^[0-9()+\s.-]{8,20}$/.test(number)) {
      showToast("Informe um número válido.");
      numberInput.focus();
      return;
    }
    if (!type) {
      showToast("Selecione o tipo do cliente.");
      typeSelect.focus();
      return;
    }

    const duplicate = clients.some(client =>
      client.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") &&
      client.id !== editingId
    );
    if (duplicate) {
      showToast("Já existe um cliente cadastrado com esse nome.");
      nameInput.focus();
      return;
    }

    if (editingId) {
      clients = clients.map(client =>
        client.id === editingId ? { ...client, name, number, type } : client
      );
      showToast("Cliente atualizado com sucesso.");
    } else {
      clients.push({ id: createId(), name, number, type });
      showToast("Cliente cadastrado com sucesso.");
    }

    saveClients();
    resetForm();
    renderClients();
  });

  list.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;
    const client = clients.find(item => item.id === id);
    if (!client) return;

    if (action === "edit") {
      startEdit(id);
    } else if (action === "delete") {
      const confirmed = window.confirm(`Deseja excluir o cliente "${client.name}" do sistema?`);
      if (!confirmed) return;
      clients = clients.filter(item => item.id !== id);
      if (editingId === id) resetForm();
      saveClients();
      renderClients();
      showToast("Cliente excluído.");
    }
  });

  cancelEditButton.addEventListener("click", resetForm);
  searchInput.addEventListener("input", renderClients);

  renderClients();
})();
