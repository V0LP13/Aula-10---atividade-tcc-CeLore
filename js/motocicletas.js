(() => {
  "use strict";

  const STORAGE_KEY = "celore_dms_motorcycles_v1";
  const form = document.querySelector("#motorcycle-form");
  const modelInput = document.querySelector("#model");
  const priceInput = document.querySelector("#price");
  const quantityInput = document.querySelector("#quantity");
  const list = document.querySelector("#motorcycle-list");
  const emptyState = document.querySelector("#empty-state");
  const searchInput = document.querySelector("#search");
  const modelCount = document.querySelector("#model-count");
  const unitCount = document.querySelector("#unit-count");
  const formTitle = document.querySelector("#form-title");
  const submitButton = document.querySelector("#submit-button");
  const cancelEditButton = document.querySelector("#cancel-edit");
  const toast = document.querySelector("#toast");

  let motorcycles = loadMotorcycles();
  let editingId = null;
  let toastTimer;

  function createId() {
    return (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadMotorcycles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Não foi possível ler o estoque salvo:", error);
      return [];
    }
  }

  function saveMotorcycles() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(motorcycles));
    } catch (error) {
      console.error("Não foi possível salvar o estoque:", error);
      showToast("Não foi possível salvar os dados neste navegador.");
    }
  }

  function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
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

  function getStockStatus(quantity) {
    if (quantity <= 0) return { label: "Sem estoque", className: "out" };
    if (quantity <= 2) return { label: "Estoque baixo", className: "low" };
    return { label: "Disponível", className: "" };
  }

  function renderMotorcycles() {
    const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = motorcycles.filter(moto =>
      moto.model.toLocaleLowerCase("pt-BR").includes(query)
    );

    modelCount.textContent = motorcycles.length;
    unitCount.textContent = motorcycles.reduce((total, moto) => total + Number(moto.quantity), 0);
    list.innerHTML = "";

    filtered.forEach(moto => {
      const status = getStockStatus(Number(moto.quantity));
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div class="model-cell">
            <span class="moto-mini-icon"><i class="fa-solid fa-motorcycle"></i></span>
            <span>${escapeHTML(moto.model)}</span>
          </div>
        </td>
        <td>${formatCurrency(moto.price)}</td>
        <td>${Number(moto.quantity)}</td>
        <td><span class="stock-badge ${status.className}">${status.label}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn" type="button" data-action="edit" data-id="${escapeHTML(moto.id)}" aria-label="Editar ${escapeHTML(moto.model)}" title="Editar">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn delete" type="button" data-action="delete" data-id="${escapeHTML(moto.id)}" aria-label="Excluir ${escapeHTML(moto.model)}" title="Excluir">
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
    formTitle.textContent = "Nova Motocicleta";
    submitButton.innerHTML = '<i class="fa-solid fa-plus"></i><span>Cadastrar moto</span>';
    cancelEditButton.classList.add("hidden");
  }

  function startEdit(id) {
    const moto = motorcycles.find(item => item.id === id);
    if (!moto) return;

    editingId = id;
    modelInput.value = moto.model;
    priceInput.value = moto.price;
    quantityInput.value = moto.quantity;
    formTitle.textContent = "Editar Motocicleta";
    submitButton.innerHTML = '<i class="fa-solid fa-check"></i><span>Salvar alterações</span>';
    cancelEditButton.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    modelInput.focus({ preventScroll: true });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const model = modelInput.value.trim();
    const price = Number(priceInput.value);
    const quantity = Number(quantityInput.value);

    if (!model) {
      showToast("Informe o modelo da motocicleta.");
      modelInput.focus();
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showToast("Informe um preço maior que zero.");
      priceInput.focus();
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      showToast("A quantidade deve ser um número inteiro igual ou maior que zero.");
      quantityInput.focus();
      return;
    }

    const duplicate = motorcycles.some(moto =>
      moto.model.toLocaleLowerCase("pt-BR") === model.toLocaleLowerCase("pt-BR") &&
      moto.id !== editingId
    );
    if (duplicate) {
      showToast("Já existe uma motocicleta cadastrada com esse modelo.");
      modelInput.focus();
      return;
    }

    if (editingId) {
      motorcycles = motorcycles.map(moto =>
        moto.id === editingId ? { ...moto, model, price, quantity } : moto
      );
      showToast("Motocicleta atualizada com sucesso.");
    } else {
      motorcycles.push({ id: createId(), model, price, quantity });
      showToast("Motocicleta cadastrada com sucesso.");
    }

    saveMotorcycles();
    resetForm();
    renderMotorcycles();
  });

  list.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;
    const moto = motorcycles.find(item => item.id === id);
    if (!moto) return;

    if (action === "edit") {
      startEdit(id);
    } else if (action === "delete") {
      const confirmed = window.confirm(`Deseja excluir o modelo "${moto.model}" do estoque?`);
      if (!confirmed) return;
      motorcycles = motorcycles.filter(item => item.id !== id);
      if (editingId === id) resetForm();
      saveMotorcycles();
      renderMotorcycles();
      showToast("Motocicleta excluída.");
    }
  });

  cancelEditButton.addEventListener("click", resetForm);
  searchInput.addEventListener("input", renderMotorcycles);

  renderMotorcycles();
})();
