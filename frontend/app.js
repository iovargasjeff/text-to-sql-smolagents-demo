document.addEventListener("DOMContentLoaded", () => {
    const providerSelect = document.getElementById("providerSelect");
    const modelSelect = document.getElementById("modelSelect");
    const questionInput = document.getElementById("questionInput");
    const runBtn = document.getElementById("runBtn");
    const chatArea = document.getElementById("chatArea");
    const welcomeMessage = document.querySelector(".welcome-message");

    let providersData = [];

    // Cargar proveedores
    fetch("/api/providers")
        .then(res => res.json())
        .then(data => {
            providersData = data.providers;
            populateProviders();
        });

    function populateProviders() {
        providerSelect.innerHTML = "";
        providersData.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name;
            providerSelect.appendChild(opt);
        });
        updateModels();
    }

    function updateModels() {
        const pId = providerSelect.value;
        const provider = providersData.find(p => p.id === pId);
        modelSelect.innerHTML = "";
        
        if (provider && provider.models) {
            provider.models.forEach(m => {
                const opt = document.createElement("option");
                opt.value = m.id;
                let suffix = m.metadata?.recommended ? " (Recomendado)" : "";
                opt.textContent = m.name + suffix;
                modelSelect.appendChild(opt);
            });
        }
    }

    providerSelect.addEventListener("change", updateModels);

    // Ajustar textarea dinámicamente
    questionInput.addEventListener("input", function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    questionInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            runBtn.click();
        }
    });

    // Ejemplos
    document.querySelectorAll(".example-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            questionInput.value = btn.textContent;
            runBtn.click();
        });
    });

    // Enviar pregunta
    runBtn.addEventListener("click", async () => {
        const question = questionInput.value.trim();
        if (!question) return;

        // Ocultar bienvenida si existe
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // 1. Mensaje del usuario
        appendUserMessage(question);
        questionInput.value = "";
        questionInput.style.height = 'auto';

        // 2. Estado de carga
        runBtn.disabled = true;
        const loadingNode = appendLoadingMessage();
        scrollToBottom();

        try {
            const req = {
                question: question,
                provider: providerSelect.value,
                model: modelSelect.value
            };

            const res = await fetch("/api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req)
            });

            const data = await res.json();
            
            // Remover loading
            loadingNode.remove();

            // 3. Respuesta del asistente
            if (!data.success) {
                appendErrorMessage(data.error || "Error desconocido.");
            } else {
                appendAssistantMessage(data);
            }
        } catch (err) {
            loadingNode.remove();
            appendErrorMessage(`Error de red: ${err.message}`);
        } finally {
            runBtn.disabled = false;
            scrollToBottom();
            questionInput.focus();
        }
    });

    function appendUserMessage(text) {
        const row = document.createElement("div");
        row.className = "msg-row user";
        const bubble = document.createElement("div");
        bubble.className = "msg-bubble";
        bubble.textContent = text;
        row.appendChild(bubble);
        chatArea.appendChild(row);
    }

    function appendLoadingMessage() {
        const row = document.createElement("div");
        row.className = "msg-row bot";
        const bubble = document.createElement("div");
        bubble.className = "msg-bubble loading-bubble";
        bubble.innerHTML = '<div class="spinner"></div><span>Procesando consulta...</span>';
        row.appendChild(bubble);
        chatArea.appendChild(row);
        return row;
    }

    function appendErrorMessage(errorMsg) {
        const row = document.createElement("div");
        row.className = "msg-row bot";
        const bubble = document.createElement("div");
        bubble.className = "msg-bubble error-bubble";
        bubble.textContent = `Ups, ocurrió un error:\n${errorMsg}`;
        row.appendChild(bubble);
        chatArea.appendChild(row);
    }

    function appendAssistantMessage(data) {
        const row = document.createElement("div");
        row.className = "msg-row bot";
        const bubble = document.createElement("div");
        bubble.className = "msg-bubble";

        // Respuesta en lenguaje natural
        const answerDiv = document.createElement("div");
        answerDiv.className = "bot-answer";
        answerDiv.textContent = data.answer || "No se pudo generar una respuesta.";
        bubble.appendChild(answerDiv);

        // SQL (Colapsable)
        if (data.generated_sql) {
            const sqlDetails = document.createElement("details");
            const sqlSummary = document.createElement("summary");
            sqlSummary.textContent = "Ver SQL Generado";
            const sqlContent = document.createElement("div");
            sqlContent.className = "details-content";
            const pre = document.createElement("pre");
            const code = document.createElement("code");
            code.textContent = data.generated_sql;
            pre.appendChild(code);
            sqlContent.appendChild(pre);
            sqlDetails.appendChild(sqlSummary);
            sqlDetails.appendChild(sqlContent);
            bubble.appendChild(sqlDetails);
        }

        // Resultados (Colapsable)
        if (data.rows) {
            const tableDetails = document.createElement("details");
            tableDetails.open = true; // Abierto por defecto
            const tableSummary = document.createElement("summary");
            tableSummary.textContent = `Ver Datos (${data.row_count} filas)`;
            
            const tableContent = document.createElement("div");
            tableContent.className = "details-content table-wrapper";
            
            if (data.rows.length > 0) {
                const table = renderTableHTML(data.rows);
                tableContent.appendChild(table);
            } else {
                tableContent.innerHTML = "<p>No hay filas devueltas.</p>";
            }

            tableDetails.appendChild(tableSummary);
            tableDetails.appendChild(tableContent);
            bubble.appendChild(tableDetails);
        }

        // Footer Metadata
        const footer = document.createElement("div");
        footer.className = "metadata-footer";
        footer.textContent = `Ejecutado sobre PostgreSQL | Proveedor: ${data.provider} | Modelo: ${data.model}`;
        bubble.appendChild(footer);

        row.appendChild(bubble);
        chatArea.appendChild(row);
    }

    function renderTableHTML(rows) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        const headers = Object.keys(rows[0]);
        const trHead = document.createElement("tr");
        headers.forEach(h => {
            const th = document.createElement("th");
            th.textContent = h;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        rows.forEach(row => {
            const tr = document.createElement("tr");
            headers.forEach(h => {
                const td = document.createElement("td");
                td.textContent = row[h];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
});
