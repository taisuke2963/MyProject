const employeeListEl = document.getElementById("employee-list");
const chatHeaderEl = document.getElementById("chat-header");
const chatMessagesEl = document.getElementById("chat-messages");
const chatFormEl = document.getElementById("chat-form");
const chatInputEl = document.getElementById("chat-input");
const chatSubmitEl = chatFormEl.querySelector("button");

let employees = [];
let currentEmployee = null;
const historyByEmployee = {};

async function loadEmployees() {
  const res = await fetch("/api/employees");
  employees = await res.json();
  renderEmployeeList();
}

function renderEmployeeList() {
  employeeListEl.innerHTML = "";
  employees.forEach((emp) => {
    const card = document.createElement("div");
    card.className = "employee-card" + (currentEmployee?.id === emp.id ? " active" : "");
    card.innerHTML = `
      <div class="avatar">${emp.avatar}</div>
      <div class="info">
        <div class="name">${emp.name}</div>
        <div class="role">${emp.role}</div>
      </div>
    `;
    card.addEventListener("click", () => selectEmployee(emp));
    employeeListEl.appendChild(card);
  });
}

function selectEmployee(emp) {
  currentEmployee = emp;
  if (!historyByEmployee[emp.id]) {
    historyByEmployee[emp.id] = [];
  }
  chatHeaderEl.textContent = `${emp.avatar} ${emp.name}（${emp.role}） - ${emp.tagline}`;
  chatInputEl.disabled = false;
  chatSubmitEl.disabled = false;
  renderEmployeeList();
  renderMessages();
}

function renderMessages() {
  chatMessagesEl.innerHTML = "";
  const history = historyByEmployee[currentEmployee.id] || [];
  history.forEach((msg) => {
    const el = document.createElement("div");
    el.className = `message ${msg.role}`;
    el.textContent = msg.content;
    chatMessagesEl.appendChild(el);
  });
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function addSystemNote(text) {
  const el = document.createElement("div");
  el.className = "message system";
  el.textContent = text;
  chatMessagesEl.appendChild(el);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

chatFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInputEl.value.trim();
  if (!text || !currentEmployee) return;

  const history = historyByEmployee[currentEmployee.id];
  history.push({ role: "user", content: text });
  chatInputEl.value = "";
  renderMessages();

  chatInputEl.disabled = true;
  chatSubmitEl.disabled = true;
  addSystemNote("入力中…");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: currentEmployee.id, messages: history }),
    });
    const data = await res.json();

    chatMessagesEl.removeChild(chatMessagesEl.lastChild);

    if (!res.ok) {
      addSystemNote(data.error || "エラーが発生しました。");
    } else {
      history.push({ role: "assistant", content: data.reply });
      renderMessages();
    }
  } catch (err) {
    chatMessagesEl.removeChild(chatMessagesEl.lastChild);
    addSystemNote("通信エラーが発生しました。");
  } finally {
    chatInputEl.disabled = false;
    chatSubmitEl.disabled = false;
    chatInputEl.focus();
  }
});

loadEmployees();
