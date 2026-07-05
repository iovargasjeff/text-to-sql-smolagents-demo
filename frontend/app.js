document.addEventListener("DOMContentLoaded", () => {
    const providerSelect = document.getElementById("providerSelect");
    const modelSelect = document.getElementById("modelSelect");
    const questionInput = document.getElementById("questionInput");
    const runBtn = document.getElementById("runBtn");
    const loader = document.getElementById("loader");
    const resultsSection = document.getElementById("resultsSection");
    const errorBox = document.getElementById("errorBox");
    const sqlOutput = document.getElementById("sqlOutput");
    const tableOutput = document.getElementById("tableOutput");
    const usedModelBadge = document.getElementById("usedModelBadge");

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

    // Ejemplos
    document.querySelectorAll(".example-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            questionInput.value = btn.textContent;
        });
    });

    // Ejecutar
    runBtn.addEventListener("click", async () => {
        const question = questionInput.value.trim();
        if (!question) return;

        // UI de carga
        runBtn.disabled = true;
        loader.classList.remove("hidden");
        resultsSection.classList.add("hidden");
        errorBox.classList.add("hidden");
        sqlOutput.textContent = "";
        tableOutput.innerHTML = "";

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
            
            resultsSection.classList.remove("hidden");
            usedModelBadge.textContent = `${data.provider} | ${data.model}`;

            if (!data.success) {
                errorBox.textContent = `Error: ${data.error || "Ocurrió un error desconocido."}`;
                errorBox.classList.remove("hidden");
            } else {
                sqlOutput.textContent = data.generated_sql;
                renderTable(data.results);
            }
        } catch (err) {
            resultsSection.classList.remove("hidden");
            errorBox.textContent = `Error de red: ${err.message}`;
            errorBox.classList.remove("hidden");
        } finally {
            runBtn.disabled = false;
            loader.classList.add("hidden");
        }
    });

    function renderTable(rows) {
        if (!rows || rows.length === 0) {
            tableOutput.innerHTML = "<p>No se encontraron resultados.</p>";
            return;
        }

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
        tableOutput.appendChild(table);
    }
});
