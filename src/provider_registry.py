import json
import os

def load_provider_catalog() -> dict:
    """Carga el catálogo de proveedores y modelos desde config/providers.json"""
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "providers.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_provider(provider_id: str) -> dict:
    catalog = load_provider_catalog()
    for p in catalog.get("providers", []):
        if p["id"] == provider_id:
            return p
    return None

def get_models_for_provider(provider_id: str) -> list:
    provider = get_provider(provider_id)
    if provider:
        return provider.get("models", [])
    return []

def is_valid_model(provider_id: str, model_id: str) -> bool:
    models = get_models_for_provider(provider_id)
    return any(m["id"] == model_id for m in models)
