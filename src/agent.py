import sys
from tabulate import tabulate
from src.text_to_sql import process_question
from src.vector_search import search_knowledge

def main():
    if len(sys.argv) < 3:
        print("Uso:")
        print("  python src/agent.py sql \"<pregunta>\"")
        print("  python src/agent.py vector \"<vector_4d>\"")
        sys.exit(1)

    command = sys.argv[1].lower()
    payload = sys.argv[2]

    if command == "sql":
        print(f"Pregunta: {payload}\n")
        
        result = process_question(payload)
        
        if not result.get("success"):
            print(f"Error: {result.get('error')}")
            sys.exit(1)
            
        print(f"SQL Generado:\n{result['generated_sql']}\n")
        
        rows = result["results"]
        if not rows:
            print("No se encontraron resultados.")
        else:
            print("Resultados:")
            # Usar tabulate para un output limpio
            headers = rows[0].keys()
            table = [list(r.values()) for r in rows]
            print(tabulate(table, headers=headers, tablefmt="grid"))
            
    elif command == "vector":
        print(f"Búsqueda Vectorial para: [{payload}]\n")
        rows = search_knowledge(payload)
        
        if not rows:
            print("No se encontraron resultados.")
        else:
            print("Fragmentos más relevantes:")
            for r in rows:
                print(f"- Distancia: {r['distance']:.4f} | Origen: {r['source']}")
                print(f"  Contenido: {r['content']}\n")
                
    else:
        print(f"Comando desconocido: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
