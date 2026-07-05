document.addEventListener("DOMContentLoaded", () => {
    const providerSelect = document.getElementById("providerSelect");
    const modelSelect = document.getElementById("modelSelect");
    const questionInput = document.getElementById("questionInput");
    const runBtn = document.getElementById("runBtn");
    const chatArea = document.getElementById("chatArea");
    const welcomeMessage = document.querySelector(".welcome-message");
    const historyList = document.getElementById("historyList");
    const filterBtns = document.querySelectorAll(".filter-btn");

    let providersData = [];
    let currentFilter = "all";

    // Cargar proveedores
    fetch("/api/providers")
        .then(res => res.json())
        .then(data => {
            providersData = data.providers;
            populateProviders();
        });

    // Cargar historial
    loadHistory();

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
            
            // Recargar historial después de una consulta
            loadHistory();
        } catch (err) {
            loadingNode.remove();
            appendErrorMessage(`Error de red: ${err.message}`);
        } finally {
            runBtn.disabled = false;
            scrollToBottom();
            questionInput.focus();
        }
    });

    function loadHistory() {
        let url = "/api/history?limit=20";
        if (currentFilter !== "all") {
            url += `&status=${currentFilter}`;
        }
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                renderHistoryList(data.history);
            })
            .catch(err => console.error("Error cargando historial", err));
    }

    function renderHistoryList(items) {
        historyList.innerHTML = "";
        if (!items || items.length === 0) {
            historyList.innerHTML = "<p style='color:#94a3b8; font-size: 0.85rem; text-align: center; margin-top:20px;'>No hay consultas recientes.</p>";
            return;
        }

        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-item";
            
            const time = new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const isSuccess = item.status === "success";
            const badgeClass = isSuccess ? "success" : "error";
            const badgeText = isSuccess ? "Éxito" : "Error";
            const latency = item.latency_ms ? `${item.latency_ms}ms` : "-";
            const rows = item.row_count !== null ? `${item.row_count} filas` : "";
            
            div.innerHTML = `
                <div class="hi-header">
                    <span class="hi-badge ${badgeClass}">${badgeText}</span>
                    <span class="hi-time">${time}</span>
                </div>
                <div class="hi-question" title="${item.question}">${item.question}</div>
                <div class="hi-footer">
                    <span>${item.provider}/${item.model}</span>
                    <span>${latency} ${rows ? '| ' + rows : ''}</span>
                </div>
            `;
            
            div.addEventListener("click", () => loadHistoryDetail(item.id));
            historyList.appendChild(div);
        });
    }

    function loadHistoryDetail(id) {
        fetch(`/api/history/${id}`)
            .then(res => res.json())
            .then(data => {
                // Ocultar bienvenida si existe
                if (welcomeMessage) {
                    welcomeMessage.style.display = 'none';
                }
                
                // Imprimir como un nuevo intercambio en el chat
                appendUserMessage(data.question);
                
                if (data.status === "success") {
                    // Adaptar la data para que appendAssistantMessage la entienda
                    const adaptedData = {
                        answer: data.natural_answer,
                        generated_sql: data.generated_sql,
                        rows: [], // No guardamos los rows en DB, así que la tabla estará vacía
                        row_count: data.row_count,
                        provider: data.provider,
                        model: data.model
                    };
                    appendAssistantMessage(adaptedData, true); // true = es un log pasado
                } else {
                    appendErrorMessage(data.error_message || "Error desconocido");
                }
                
                scrollToBottom();
            })
            .catch(err => console.error("Error obteniendo detalle", err));
    }

    filterBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentFilter = e.target.dataset.filter;
            loadHistory();
        });
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

    function appendAssistantMessage(data, isHistory = false) {
        const row = document.createElement("div");
        row.className = "msg-row bot";
        const bubble = document.createElement("div");
        bubble.className = "msg-bubble";

        // Respuesta en lenguaje natural
        const answerDiv = document.createElement("div");
        answerDiv.className = "bot-answer";
        if (isHistory) {
            answerDiv.innerHTML = `<span style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:5px;">(Consulta del Historial)</span>` + (data.answer || "No se pudo generar una respuesta.");
        } else {
            answerDiv.textContent = data.answer || "No se pudo generar una respuesta.";
        }
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
        if (data.rows && !isHistory) {
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
        } else if (isHistory) {
            const historyNote = document.createElement("div");
            historyNote.style.fontSize = "0.8rem";
            historyNote.style.color = "#64748b";
            historyNote.style.marginTop = "10px";
            historyNote.textContent = `Nota: Los datos reales no se almacenan en el historial por seguridad. Filas devueltas originalmente: ${data.row_count || 0}.`;
            bubble.appendChild(historyNote);
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
