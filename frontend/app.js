document.addEventListener("DOMContentLoaded", () => {
    const providerSelect = document.getElementById("providerSelect");
    const modelSelect = document.getElementById("modelSelect");
    const questionInput = document.getElementById("questionInput");
    const runBtn = document.getElementById("runBtn");
    const chatArea = document.getElementById("chatArea");
    const welcomeMessage = document.querySelector(".welcome-message");
    const historyList = document.getElementById("historyList");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const langToggle = document.getElementById("langToggle");

    let providersData = [];
    let currentFilter = "all";
    let currentLang = "es";

    const i18n = {
        es: {
            langBtn: "🇺🇸 English",
            historyTitle: "Historial",
            filterAll: "Todos",
            filterSuccess: "Éxito",
            filterError: "Error",
            appTitle: "Text-to-SQL Assistant",
            appSubtitle: "Tu asistente para consultas a bases de datos",
            welcomeTitle: "¡Hola! ¿En qué puedo ayudarte hoy?",
            welcomeDesc: "Escribe una pregunta sobre tus datos y la convertiré en una consulta SQL.",
            example1: "¿Qué clientes hicieron pedidos en 2023?",
            example2: "Muestra el top 5 de productos más vendidos",
            example3: "Total de ingresos por mes",
            mockNote: "Si no tienes API keys, puedes usar el proveedor <b>Mock</b>.",
            inputPlaceholder: "Ej: ¿Cuáles son los clientes con más compras?",
            runBtnTitle: "Ejecutar Consulta",
            noHistory: "No hay consultas recientes.",
            errorUnknown: "Error desconocido.",
            networkError: "Error de red:",
            errorTitle: "Ups, ocurrió un error:",
            processing: "Procesando consulta...",
            noAnswer: "No se pudo generar una respuesta.",
            historyNote: "(Consulta del Historial)",
            viewSql: "Ver SQL Generado",
            viewData: "Ver Datos",
            noRows: "No hay filas devueltas.",
            historyMockRows: "Nota: Los datos reales no se almacenan en el historial por seguridad. Filas devueltas originalmente:",
            footerMeta: "Ejecutado sobre PostgreSQL | Proveedor:"
        },
        en: {
            langBtn: "🇪🇸 Español",
            historyTitle: "History",
            filterAll: "All",
            filterSuccess: "Success",
            filterError: "Error",
            appTitle: "Text-to-SQL Assistant",
            appSubtitle: "Your database query assistant",
            welcomeTitle: "Hello! How can I help you today?",
            welcomeDesc: "Write a question about your data and I will convert it into an SQL query.",
            example1: "Which customers placed orders in 2023?",
            example2: "Show the top 5 best-selling products",
            example3: "Total revenue per month",
            mockNote: "If you don't have API keys, you can use the <b>Mock</b> provider.",
            inputPlaceholder: "Ex: Which customers have the most purchases?",
            runBtnTitle: "Run Query",
            noHistory: "No recent queries.",
            errorUnknown: "Unknown error.",
            networkError: "Network error:",
            errorTitle: "Oops, an error occurred:",
            processing: "Processing query...",
            noAnswer: "Could not generate an answer.",
            historyNote: "(History Query)",
            viewSql: "View Generated SQL",
            viewData: "View Data",
            noRows: "No rows returned.",
            historyMockRows: "Note: Real data is not stored in history for security. Rows originally returned:",
            footerMeta: "Executed on PostgreSQL | Provider:"
        }
    };

    function updateLanguage() {
        const texts = i18n[currentLang];
        
        langToggle.textContent = texts.langBtn;

        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (texts[key]) el.innerHTML = texts[key];
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (texts[key]) el.placeholder = texts[key];
        });

        document.querySelectorAll("[data-i18n-title]").forEach(el => {
            const key = el.getAttribute("data-i18n-title");
            if (texts[key]) el.title = texts[key];
        });
        
        loadHistory(); // Recargar historial en el idioma correcto
    }

    langToggle.addEventListener("click", () => {
        currentLang = currentLang === "es" ? "en" : "es";
        updateLanguage();
    });

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
                model: modelSelect.value,
                language: currentLang
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
                appendErrorMessage(data.error || i18n[currentLang].errorUnknown);
            } else {
                appendAssistantMessage(data);
            }
            
            // Recargar historial después de una consulta
            loadHistory();
        } catch (err) {
            loadingNode.remove();
            appendErrorMessage(`${i18n[currentLang].networkError} ${err.message}`);
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
            historyList.innerHTML = `<p style='color:#94a3b8; font-size: 0.85rem; text-align: center; margin-top:20px;'>${i18n[currentLang].noHistory}</p>`;
            return;
        }

        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-item";
            
            const time = new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const isSuccess = item.status === "success";
            const badgeClass = isSuccess ? "success" : "error";
            const badgeText = isSuccess ? i18n[currentLang].filterSuccess : i18n[currentLang].filterError;
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
                // Limpiar el área de chat de interacciones anteriores
                chatArea.innerHTML = "";
                
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
                    appendErrorMessage(data.error_message || i18n[currentLang].errorUnknown);
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
        bubble.innerHTML = `<div class="spinner"></div><span>${i18n[currentLang].processing}</span>`;
        row.appendChild(bubble);
        chatArea.appendChild(row);
        return row;
    }

    function appendErrorMessage(errorMsg) {
        const row = document.createElement("div");
        row.className = "msg-row bot";
        const bubble = document.createElement("div");
        bubble.className = "msg-bubble error-bubble";
        bubble.textContent = `${i18n[currentLang].errorTitle}\n${errorMsg}`;
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
            answerDiv.innerHTML = `<span style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:5px;">${i18n[currentLang].historyNote}</span>` + (data.answer || i18n[currentLang].noAnswer);
        } else {
            answerDiv.textContent = data.answer || i18n[currentLang].noAnswer;
        }
        bubble.appendChild(answerDiv);

        // SQL (Colapsable)
        if (data.generated_sql) {
            const sqlDetails = document.createElement("details");
            const sqlSummary = document.createElement("summary");
            sqlSummary.textContent = i18n[currentLang].viewSql;
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
            tableSummary.textContent = `${i18n[currentLang].viewData} (${data.row_count})`;
            
            const tableContent = document.createElement("div");
            tableContent.className = "details-content table-wrapper";
            
            if (data.rows.length > 0) {
                const table = renderTableHTML(data.rows);
                tableContent.appendChild(table);
            } else {
                tableContent.innerHTML = `<p>${i18n[currentLang].noRows}</p>`;
            }

            tableDetails.appendChild(tableSummary);
            tableDetails.appendChild(tableContent);
            bubble.appendChild(tableDetails);
        } else if (isHistory) {
            const historyNote = document.createElement("div");
            historyNote.style.fontSize = "0.8rem";
            historyNote.style.color = "#64748b";
            historyNote.style.marginTop = "10px";
            historyNote.textContent = `${i18n[currentLang].historyMockRows} ${data.row_count || 0}.`;
            bubble.appendChild(historyNote);
        }

        // Footer Metadata
        const footer = document.createElement("div");
        footer.className = "metadata-footer";
        footer.textContent = `${i18n[currentLang].footerMeta} ${data.provider} | Modelo: ${data.model}`;
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
