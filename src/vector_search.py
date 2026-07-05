from src.db import run_query

def search_knowledge(vector_str: str, limit: int = 2) -> list[dict]:
    """
    Realiza una búsqueda de similitud vectorial utilizando pgvector.
    :param vector_str: Un string que representa un vector, ej: "0.1,0.2,0.3,0.4"
    """
    try:
        # Convertir a lista de floats para asegurar formato
        vector_list = [float(x) for x in vector_str.split(",")]
        if len(vector_list) != 4:
            raise ValueError("El vector debe tener exactamente 4 dimensiones para esta demo.")
        
        # Formato que postgres/pgvector espera: '[0.1, 0.2, 0.3, 0.4]'
        pg_vector_str = f"[{','.join(map(str, vector_list))}]"
        
        # El operador <-> calcula la distancia Euclidiana
        query = """
            SELECT source, content, embedding <-> %s AS distance
            FROM knowledge_chunks
            ORDER BY distance ASC
            LIMIT %s;
        """
        return run_query(query, (pg_vector_str, limit))
        
    except Exception as e:
        print(f"Error en búsqueda vectorial: {e}")
        return []
